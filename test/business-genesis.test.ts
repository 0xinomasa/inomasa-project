import assert from 'node:assert/strict';
import test from 'node:test';

import { createBusinessGenesis } from '../src/modules/business/model.ts';
import { alphaBusinessTemplates } from '../src/modules/business/templates.ts';
import {
  activateCircleTreasuryBinding,
  createPendingCircleTreasuryBinding,
} from '../src/modules/business/treasury.ts';

const operator = {
  actorClassification: 'COMMON_CONTROL_TEST',
  displayName: 'Alpha Operator',
  environment: 'PRIVATE_ARC_TESTNET',
  principalId: 'usr_alpha_operator',
} as const;

test('Alpha templates form a coherent dependency graph', () => {
  const capabilities = new Set(
    alphaBusinessTemplates.flatMap((template) =>
      template.capabilities.map(({ capabilityId }) => capabilityId),
    ),
  );

  assert.equal(alphaBusinessTemplates.length, 2);
  assert.ok(
    alphaBusinessTemplates
      .flatMap(({ dependencies }) => dependencies)
      .every((dependency) => capabilities.has(dependency)),
  );
});

test('deterministic genesis keeps Business identity, controller, and wallet binding separate', () => {
  const genesis = createBusinessGenesis(
    {
      commonControlGroupId: 'ccg_alpha_operator',
      controller: operator,
      genesisRequestId: 'genesis-signal-forge-1',
      templateId: 'signal-forge',
    },
    {
      businessId: 'biz_signal_forge',
      controlId: 'ctl_signal_forge_1',
      eventId: 'evt_signal_forge_genesis',
    },
    '2026-08-25T08:00:00.000Z',
  );
  const pendingBinding = createPendingCircleTreasuryBinding({
    bindingId: 'tbn_signal_forge_1',
    business: genesis.business,
  });
  const activeBinding = activateCircleTreasuryBinding(
    pendingBinding,
    'tbn_signal_forge_2',
    'circle-wallet-id',
    '0x1111111111111111111111111111111111111111',
  );

  assert.equal(genesis.business.businessId, 'biz_signal_forge');
  assert.equal(genesis.control.controllerPrincipalId, 'usr_alpha_operator');
  assert.notEqual(activeBinding.address, genesis.business.businessId);
  assert.equal(activeBinding.accountAssurance, 'PLATFORM_CONTROLLED_EXTERNAL');
  assert.equal(activeBinding.bindingVersion, 2);
});

test('common-control genesis is rejected when its provenance group is missing', () => {
  assert.throws(
    () =>
      createBusinessGenesis(
        {
          controller: operator,
          genesisRequestId: 'genesis-invalid',
          templateId: 'signal-forge',
        },
        {
          businessId: 'biz_invalid',
          controlId: 'ctl_invalid',
          eventId: 'evt_invalid',
        },
        '2026-08-25T08:00:00.000Z',
      ),
    /Common-control group ID/,
  );
});
