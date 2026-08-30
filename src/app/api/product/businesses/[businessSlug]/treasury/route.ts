import { getProductSession } from '@/app/_auth/server.ts';
import { deriveTreasuryProvisioningIdentity } from '@/modules/business/operational-workspace.ts';
import { activateCircleTreasuryBinding, type TreasuryBinding } from '@/modules/business/treasury.ts';
import { formatUsdcAmount } from '@/modules/commerce/money.ts';
import { readCircleDeveloperWalletConfig } from '@/platform/circle/config.ts';
import { CircleDeveloperWalletAdapter } from '@/platform/circle/developer-wallets.ts';
import { readDatabaseConnectionConfig } from '@/platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '@/platform/persistence/alpha-business-repository.ts';
import { PostgresPersistence } from '@/platform/persistence/database.ts';
import { PostgresOperationalWorkspaceRepository } from '@/platform/persistence/operational-workspace-repository.ts';

export const dynamic = 'force-dynamic';

type Context = { readonly params: Promise<{ readonly businessSlug: string }> };

export async function POST(request: Request, context: Context): Promise<Response> {
  const session = await getProductSession();
  if (session === null) return Response.json({ error: 'Product authentication is required.' }, { status: 401 });
  if (!process.env['INOMASA_ENV']?.trim() || !process.env['DATABASE_URL']?.trim()) {
    return Response.json({ error: 'Treasury persistence is not configured.' }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
  const action = body['action'];
  if (action !== 'PROVISION' && action !== 'CHECK_BALANCE') {
    return Response.json({ error: 'Choose a supported Treasury action.' }, { status: 400 });
  }

  let persistence: PostgresPersistence | undefined;
  try {
    const { businessSlug } = await context.params;
    const databaseConfig = readDatabaseConnectionConfig('runtime');
    if (databaseConfig.environment !== session.environment) {
      return Response.json({ error: 'Session and database environments do not match.' }, { status: 409 });
    }
    persistence = new PostgresPersistence(databaseConfig);
    const operationalRepository = new PostgresOperationalWorkspaceRepository(persistence);
    const business = await operationalRepository.getBusinessForController({
      controllerPrincipalId: session.principalId,
      slug: businessSlug,
    });
    if (business === undefined) return Response.json({ error: 'Business not found.' }, { status: 404 });
    let treasury = await operationalRepository.getTreasury({
      controllerPrincipalId: session.principalId,
      slug: businessSlug,
    });
    if (treasury === undefined) {
      return Response.json({ error: 'This Business has no Treasury binding.' }, { status: 409 });
    }

    const circleConfig = readCircleDeveloperWalletConfig();
    if (databaseConfig.environment !== 'PRIVATE_ARC_TESTNET' || circleConfig.environment !== 'PRIVATE_ARC_TESTNET') {
      return Response.json(
        { error: 'Treasury provider actions are restricted to the private Arc Testnet runtime.' },
        { status: 409 },
      );
    }
    const adapter = new CircleDeveloperWalletAdapter(circleConfig);

    if (action === 'PROVISION' && treasury.status === 'PENDING') {
      const identity = deriveTreasuryProvisioningIdentity({
        businessId: business.businessId,
        controllerPrincipalId: session.principalId,
        pendingBindingId: treasury.bindingId,
      });
      const wallet = await adapter.provisionWallet({
        businessId: business.businessId,
        displayName: business.displayName,
        idempotencyKey: identity.idempotencyKey,
      });
      const pendingBinding: TreasuryBinding = {
        accountAssurance: 'PLATFORM_CONTROLLED_EXTERNAL',
        accountType: 'EOA',
        bindingId: treasury.bindingId,
        bindingVersion: treasury.bindingVersion,
        blockchain: 'ARC-TESTNET',
        businessId: business.businessId,
        custodyModel: 'DEVELOPER_CONTROLLED',
        environment: business.environment,
        provider: 'CIRCLE',
        status: 'PENDING',
      };
      const activeBinding = activateCircleTreasuryBinding(
        pendingBinding,
        identity.activeBindingId,
        wallet.providerWalletId,
        wallet.address,
      );
      await new PostgresAlphaBusinessRepository(persistence).activateTreasuryBinding({
        activeBinding,
        controllerPrincipalId: session.principalId,
        occurredAt: new Date().toISOString(),
        pendingBindingId: treasury.bindingId,
      });
      treasury = await operationalRepository.getTreasury({
        controllerPrincipalId: session.principalId,
        slug: businessSlug,
      });
    }

    if (
      treasury === undefined ||
      treasury.status !== 'ACTIVE' ||
      treasury.address === null ||
      treasury.providerWalletId === null
    ) {
      return Response.json({ error: 'Treasury is still pending provider binding.' }, { status: 409 });
    }
    const balance = await adapter.getUsdcBalance(treasury.providerWalletId);
    return Response.json({
      address: treasury.address,
      balanceMicroUsdc: balance.toString(),
      balanceUsdc: formatUsdcAmount(balance),
      fundingState: balance > 0n ? 'FUNDED' : 'WAITING_FOR_TEST_USDC',
      status: treasury.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Treasury provider operation failed.';
    const configuration = /required|configured/i.test(message);
    return Response.json(
      { error: configuration ? 'Treasury provider is not configured for this runtime.' : 'Treasury provider is temporarily unavailable. No success was recorded.' },
      { status: configuration ? 503 : 502 },
    );
  } finally {
    await persistence?.close();
  }
}
