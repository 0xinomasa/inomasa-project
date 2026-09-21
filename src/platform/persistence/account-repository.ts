import { randomUUID } from 'node:crypto';
import type { ColumnType, Generated } from 'kysely';
import {
  accountSessionHash, accountSessionLifetimeMs, newAccountSessionToken,
  normalizeEntryEmail, validAccountSessionToken,
} from '../auth/local-entry.ts';
import type { PostgresPersistence } from './database.ts';
import type { InomasaEnvironment } from '../../shared/environment.ts';

type Timestamp = ColumnType<Date, Date, Date>;
type AccountTables = {
  accounts: {
    account_id: string; environment: string; provider_app_id: string;
    provider_subject: string; created_at: Generated<Date>;
  };
  account_sessions: {
    token_hash: string; environment: string; entry_email: string;
    account_id: string | null; challenge_hash: string | null;
    challenge_expires_at: Timestamp | null; expires_at: Timestamp; created_at: Generated<Date>;
  };
}

export interface AccountAccess {
  readonly email: string;
  readonly accountId: string | null;
}

// Only a server-side provider verifier may supply this result. No HTTP endpoint
// accepts a browser-supplied identity, email match, or success flag as this proof.
export interface AccountIdentityVerifier {
  verify(proof: unknown, challenge: string): Promise<{
    readonly providerAppId: string;
    readonly providerSubject: string;
    readonly environment: InomasaEnvironment;
    readonly challenge: string;
  }>;
}

export class AccountRepository {
  readonly #db;
  readonly #environment: InomasaEnvironment;
  constructor(persistence: PostgresPersistence, environment: InomasaEnvironment) {
    this.#db = persistence.databaseForApplication.withTables<AccountTables>().withSchema('inomasa_app');
    this.#environment = environment;
  }

  async openEntry(input: unknown, previousToken?: string): Promise<string> {
    const email = normalizeEntryEmail(input);
    if (email === null) throw new Error('Invalid email.');
    const token = newAccountSessionToken();
    await this.#db.transaction().execute(async tx => {
      if (validAccountSessionToken(previousToken)) {
        await tx.deleteFrom('account_sessions').where('token_hash', '=', accountSessionHash(previousToken))
          .where('environment', '=', this.#environment).execute();
      }
      await tx.insertInto('account_sessions').values({
        token_hash: accountSessionHash(token), environment: this.#environment, entry_email: email,
        account_id: null, challenge_hash: null, challenge_expires_at: null,
        expires_at: new Date(Date.now() + accountSessionLifetimeMs),
      }).execute();
    });
    return token;
  }

  async access(token: string | undefined): Promise<AccountAccess | null> {
    if (!validAccountSessionToken(token)) return null;
    const row = await this.#db.selectFrom('account_sessions').select(['entry_email', 'account_id'])
      .where('token_hash', '=', accountSessionHash(token)).where('environment', '=', this.#environment)
      .where('expires_at', '>', new Date()).executeTakeFirst();
    return row ? { email: row.entry_email, accountId: row.account_id } : null;
  }

  async logout(token: string | undefined): Promise<void> {
    if (!validAccountSessionToken(token)) return;
    await this.#db.deleteFrom('account_sessions').where('token_hash', '=', accountSessionHash(token))
      .where('environment', '=', this.#environment).execute();
  }

  async beginAuthentication(token: string): Promise<string> {
    if (!validAccountSessionToken(token)) throw new Error('Session expired.');
    const challenge = newAccountSessionToken();
    const updated = await this.#db.updateTable('account_sessions').set({
      challenge_hash: accountSessionHash(challenge), challenge_expires_at: new Date(Date.now() + 5 * 60_000),
    }).where('token_hash', '=', accountSessionHash(token)).where('environment', '=', this.#environment)
      .where('expires_at', '>', new Date()).returning('token_hash').executeTakeFirst();
    if (!updated) throw new Error('Session expired.');
    return challenge;
  }

  async completeAuthentication(token: string, challenge: string, proof: unknown,
    expectedProviderAppId: string, verifier: AccountIdentityVerifier): Promise<string> {
    if (!validAccountSessionToken(token) || !validAccountSessionToken(challenge) || !expectedProviderAppId.trim()) {
      throw new Error('Invalid authentication context.');
    }
    const pending = await this.#db.selectFrom('account_sessions').select('token_hash')
      .where('token_hash', '=', accountSessionHash(token)).where('environment', '=', this.#environment)
      .where('expires_at', '>', new Date()).where('challenge_hash', '=', accountSessionHash(challenge))
      .where('challenge_expires_at', '>', new Date()).executeTakeFirst();
    if (!pending) throw new Error('Authentication expired.');
    const identity = await verifier.verify(proof, challenge);
    if (identity.providerAppId !== expectedProviderAppId || identity.environment !== this.#environment
      || identity.challenge !== challenge || !identity.providerSubject.trim()) {
      throw new Error('Identity verification failed.');
    }
    const replacementToken = newAccountSessionToken();
    await this.#db.transaction().execute(async tx => {
      const session = await tx.selectFrom('account_sessions').selectAll()
        .where('token_hash', '=', accountSessionHash(token)).where('environment', '=', this.#environment)
        .where('expires_at', '>', new Date()).where('challenge_hash', '=', accountSessionHash(challenge))
        .where('challenge_expires_at', '>', new Date()).forUpdate().executeTakeFirst();
      if (!session) throw new Error('Authentication expired or already consumed.');
      // Unique provider/app/environment identity serializes concurrent recovery.
      await tx.insertInto('accounts').values({account_id: `acc_${randomUUID()}`,
        environment: this.#environment, provider_app_id: identity.providerAppId,
        provider_subject: identity.providerSubject,
      }).onConflict(c => c.columns(['environment', 'provider_app_id', 'provider_subject']).doNothing()).execute();
      const account = await tx.selectFrom('accounts').select('account_id')
        .where('environment', '=', this.#environment).where('provider_app_id', '=', identity.providerAppId)
        .where('provider_subject', '=', identity.providerSubject).executeTakeFirstOrThrow();
      if (session.account_id !== null && session.account_id !== account.account_id) {
        throw new Error('Sign out before changing accounts.');
      }
      await tx.deleteFrom('account_sessions').where('token_hash', '=', session.token_hash).execute();
      await tx.insertInto('account_sessions').values({token_hash: accountSessionHash(replacementToken),
        environment: this.#environment, entry_email: session.entry_email, account_id: account.account_id,
        challenge_hash: null, challenge_expires_at: null,
        expires_at: new Date(Date.now() + accountSessionLifetimeMs),
      }).execute();
    });
    return replacementToken;
  }
}
