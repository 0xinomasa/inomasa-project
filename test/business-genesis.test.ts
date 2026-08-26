import assert from 'node:assert/strict';
import test from 'node:test';

import { createBusinessPackage } from '../src/modules/business/business-package.ts';
import { createBusinessGenesis } from '../src/modules/business/model.ts';
import {
  alphaBusinessTemplates,
  businessTemplates,
} from '../src/modules/business/templates.ts';
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

test('accepted Alpha fixture profiles retain their coherent dependency graph', () => {
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

test('BUILD exposes exactly four reusable product templates', () => {
  assert.deepEqual(
    businessTemplates.map(({ templateId }) => templateId),
    [
      'api-data-compute',
      'saas-micro-saas',
      'agent-as-a-service',
      'web3-native-digital',
    ],
  );
  assert.ok(businessTemplates.every(({ capabilities }) => capabilities.length > 0));
});

test('multiple users can create multiple generic Businesses without fixture-specific code', () => {
  const secondOperator = {
    actorClassification: 'INDEPENDENT',
    displayName: 'Second Alpha User',
    environment: 'AUTOMATED_TEST',
    principalId: 'usr_second_operator',
  } as const;
  const created = businessTemplates.map((template, index) => {
    const controller = index === 3 ? secondOperator : operator;
    const business = createBusinessGenesis(
      {
        ...(controller.actorClassification === 'COMMON_CONTROL_TEST'
          ? { commonControlGroupId: 'ccg_alpha_operator' }
          : {}),
        controller,
        displayName: `Generic Business ${index + 1}`,
        genesisRequestId: `generic-genesis-${index + 1}`,
        slug: `generic-business-${index + 1}`,
        templateId: template.templateId,
      },
      {
        businessId: `biz_generic_${index + 1}`,
        controlId: `ctl_generic_${index + 1}`,
        eventId: `evt_generic_${index + 1}`,
      },
      '2026-08-27T08:00:00.000Z',
    ).business;

    return { business, package: createBusinessPackage(business) };
  });

  assert.equal(new Set(created.map(({ business }) => business.businessId)).size, 4);
  assert.equal(created.filter(({ business }) => business.entryRoute === 'BUILD').length, 4);
  assert.ok(created.every(({ package: businessPackage }) => businessPackage.workspace === 'READY'));
  assert.equal(created[3]?.business.actorClassification, 'INDEPENDENT');
});

test('MIGRATE origin is modeled but creation remains locked', () => {
  assert.throws(
    () =>
      createBusinessGenesis(
        {
          commonControlGroupId: 'ccg_alpha_operator',
          controller: operator,
          entryRoute: 'MIGRATE',
          genesisRequestId: 'migrate-locked',
          templateId: 'saas-micro-saas',
        },
        {
          businessId: 'biz_migrate_locked',
          controlId: 'ctl_migrate_locked',
          eventId: 'evt_migrate_locked',
        },
        '2026-08-27T08:00:00.000Z',
      ),
    /LOCKED \/ NOT YET OPEN/,
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
