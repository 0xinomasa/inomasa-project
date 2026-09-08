import {
  DatabaseConfigurationError,
  readDatabaseConnectionConfig,
} from '../src/platform/persistence/config.ts';
import { loadProductEconomicRequests } from '../src/app/_commerce/application.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import { runEngineeringPersistenceProof } from '../src/platform/persistence/engineering-proof.ts';
import { runOperationalWorkspacePersistenceProof } from '../src/platform/persistence/operational-workspace-proof.ts';
import { runProductEconomicOperationPersistenceProof } from '../src/platform/persistence/product-economic-operation-proof.ts';
import { runCapitalProductPersistenceProof } from '../src/platform/persistence/capital-product-proof.ts';
import { runLocalProductPersistenceProof } from '../src/platform/persistence/local-product-proof.ts';

import { runBusinessWorkPersistenceProof } from '../src/platform/persistence/business-work-proof.ts';

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  const persistence = new PostgresPersistence(config);

  try {
    await persistence.verifyConnection();
    console.log(`database_connection=PASS environment=${config.environment}`);

    const proof = await runEngineeringPersistenceProof(persistence);
    if (!proof.valueVerified || !proof.rollbackVerified) {
      throw new Error('The B3 persistence proof did not satisfy all assertions.');
    }

    console.log('database_write_read=PASS');
    console.log('database_transaction_rollback=PASS');

    const operationalProof = await runOperationalWorkspacePersistenceProof(persistence);
    if (Object.values(operationalProof).some((verified) => !verified)) {
      throw new Error('The Work 2 Operational Workspace persistence proof did not satisfy all assertions.');
    }
    console.log('work_2_offer_idempotency=PASS');
    console.log('work_5_offer_activation_replay=PASS');
    console.log('work_5_activated_offer_controller_scope=PASS');
    console.log('work_2_agent_idempotency=PASS');
    console.log('work_2_tenant_isolation=PASS');
    console.log('work_2_treasury_isolation=PASS');
    console.log('work_2_transaction_rollback=PASS');

    const productEconomicProof = await runProductEconomicOperationPersistenceProof(
      persistence,
      loadProductEconomicRequests,
    );
    if (Object.values(productEconomicProof).some((verified) => !verified)) {
      throw new Error('The Work 3 product economic operation persistence proof did not satisfy all assertions.');
    }
    console.log('work_3_canonical_economic_read=PASS');
    console.log('work_3_application_persistence_lifecycle=PASS');
    console.log('work_3_request_idempotency=PASS');
    console.log('work_3_request_semantic_replay=PASS');
    console.log('work_3_tenant_isolation=PASS');
    console.log('work_5_activated_product_canonical_economy=PASS');
    console.log('work_5_gateway_ambiguous_handoff=PASS');
    console.log('work_5_erc8183_ambiguous_handoff=PASS');
    console.log('work_5_no_blind_provider_resubmit=PASS');

    const capitalProductProof = await runCapitalProductPersistenceProof(persistence);
    if (Object.values(capitalProductProof).some((verified) => !verified)) {
      throw new Error('The Work 4 Capital product persistence proof did not satisfy all assertions.');
    }
    console.log('work_4_capital_business_context=PASS');
    console.log('work_4_capital_tenant_isolation=PASS');
    console.log('work_4_capital_explicit_acceptance=PASS');
    console.log('work_4_capital_acceptance_replay=PASS');
    console.log('work_4_capital_fixture_cleanup=PASS');

    await runLocalProductPersistenceProof(persistence);
    console.log('local_ai_connect_context_replay_tenant=PASS');
    console.log('local_paid_delivery_authorization_idempotency=PASS');
    console.log('local_external_evidence_no_financial_posting=PASS');
    console.log('local_product_fixture_cleanup=PASS');
    await runBusinessWorkPersistenceProof(persistence);
    console.log('business_work_replay_recovery_tenancy_review=PASS');
    console.log('business_work_provider_failures_bounded_attempts_no_economics=PASS');
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  const stage =
    error instanceof DatabaseConfigurationError
      ? error.message
      : 'Database persistence proof failed.';
  console.error(`${stage} Connection details were not logged.`);
  process.exitCode = 1;
});
