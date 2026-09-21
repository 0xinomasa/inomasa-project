import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { AccountRepository, type AccountIdentityVerifier } from './account-repository.ts';
import { PostgresPersistence } from './database.ts';
import { readDatabaseConnectionConfig } from './config.ts';
import { accountSessionHash } from '../auth/local-entry.ts';

// Synthetic adapter proof only. It neither authenticates Circle nor provisions a wallet.
export async function runAccountPersistenceProof(persistence: PostgresPersistence): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (!['LOCAL_DEVELOPMENT', 'AUTOMATED_TEST'].includes(config.environment)) throw new Error('Account proof requires an isolated test profile.');
  const repository = new AccountRepository(persistence, config.environment);
  const app = `proof_${randomUUID()}`;
  const email = `${app}@example.invalid`;
  const db = persistence.databaseForApplication;
  const verifier = (subject: string, providerAppId = app): AccountIdentityVerifier => ({
    async verify(_proof, challenge) { return { providerAppId, providerSubject: subject, environment: config.environment, challenge }; },
  });
  const authenticate = async (token: string, subject: string) => {
    const challenge = await repository.beginAuthentication(token);
    return repository.completeAuthentication(token, challenge, null, app, verifier(subject));
  };
  const tokens: string[] = [];
  const entry = async () => { const token = await repository.openEntry(email); tokens.push(token); return token; };
  try {
    const first = await entry(); const other = await entry();
    assert.notEqual(first, other);
    assert.deepEqual(await repository.access(first), { email, accountId: null });
    assert.deepEqual(await repository.access(other), { email, accountId: null });
    const crossEnvironment = new AccountRepository(persistence, config.environment === 'LOCAL_DEVELOPMENT' ? 'AUTOMATED_TEST' : 'LOCAL_DEVELOPMENT');
    assert.equal(await crossEnvironment.access(first), null);
    const challenge = await repository.beginAuthentication(first);
    await assert.rejects(repository.completeAuthentication(first, challenge, null, app, verifier('owner', 'wrong-app')));
    await assert.rejects(repository.completeAuthentication(first, challenge, null, app, { async verify() { throw new Error('provider unavailable'); } }));
    assert.equal((await repository.access(first))?.accountId, null);
    const established = await repository.completeAuthentication(first, challenge, null, app, verifier('owner'));
    tokens.push(established);
    const accountId = (await repository.access(established))?.accountId;
    assert.ok(accountId);
    assert.equal(await repository.access(first), null);
    await assert.rejects(repository.completeAuthentication(first, challenge, null, app, verifier('owner')));
    assert.equal((await repository.access(other))?.accountId, null, 'same email must not recover account');
    const otherIdentity = await authenticate(other, 'unrelated-person'); tokens.push(otherIdentity);
    assert.notEqual((await repository.access(otherIdentity))?.accountId, accountId);
    const reauthChallenge = await repository.beginAuthentication(established);
    await assert.rejects(repository.completeAuthentication(established, reauthChallenge, null, app, verifier('different-owner')));
    assert.equal((await repository.access(established))?.accountId, accountId);
    await repository.logout(established);
    assert.equal(await repository.access(established), null);
    const recovered = await authenticate(await entry(), 'owner'); tokens.push(recovered);
    assert.equal((await repository.access(recovered))?.accountId, accountId);
    const [a,b] = await Promise.all([entry(), entry()]);
    const simultaneous = await Promise.all([authenticate(a, 'owner'), authenticate(b, 'owner')]);
    tokens.push(...simultaneous);
    for (const token of simultaneous) assert.equal((await repository.access(token))?.accountId, accountId);
    const expired = await entry();
    await sql`update inomasa_app.account_sessions set expires_at = now() - interval '1 minute' where token_hash = ${accountSessionHash(expired)}`.execute(db);
    assert.equal(await repository.access(expired), null);
    await assert.rejects(repository.beginAuthentication(expired));
    const staleChallengeToken = await entry(); const staleChallenge = await repository.beginAuthentication(staleChallengeToken);
    await sql`update inomasa_app.account_sessions set challenge_expires_at = now() - interval '1 minute' where token_hash = ${accountSessionHash(staleChallengeToken)}`.execute(db);
    await assert.rejects(repository.completeAuthentication(staleChallengeToken, staleChallenge, null, app, verifier('owner')));
    const revoked = await entry(); const revocationChallenge = await repository.beginAuthentication(revoked);
    await assert.rejects(repository.completeAuthentication(revoked, revocationChallenge, null, app, { async verify(_proof, verifiedChallenge) {
      await repository.logout(revoked);
      return {providerAppId:app,providerSubject:'owner',environment:config.environment,challenge:verifiedChallenge};
    } }));
    const reopened = new PostgresPersistence(config);
    try { assert.equal((await new AccountRepository(reopened, config.environment).access(recovered))?.accountId, accountId); }
    finally { await reopened.close(); }
    const count = await sql<{ n: number }>`select count(*)::int as n from inomasa_app.accounts where provider_app_id = ${app} and provider_subject = 'owner'`.execute(db);
    assert.equal(count.rows[0]?.n, 1);
  } finally {
    // Only this invocation's synthetic fixtures; no global wipe or legacy table writes.
    for (const token of tokens) await repository.logout(token);
    await sql`delete from inomasa_app.account_sessions where entry_email = ${email}`.execute(db);
    await sql`delete from inomasa_app.accounts where provider_app_id = ${app}`.execute(db);
  }
}
