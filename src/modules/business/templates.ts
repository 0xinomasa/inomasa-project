export const businessTemplates = [
  {
    capabilities: ['DATA_API', 'X402_READY'],
    defaultName: 'New Data Business',
    defaultSiteHeadline: 'Useful data, delivered for people and software.',
    description:
      'Sell APIs, data, analytics, verification, inference, or compute as reusable resources.',
    label: 'API / Data / Compute',
    templateId: 'api-data-compute',
    version: 1,
  },
  {
    capabilities: ['SOFTWARE_SERVICE', 'COMMERCE_READY'],
    defaultName: 'New SaaS Business',
    defaultSiteHeadline: 'Focused software for a specific operational job.',
    description:
      'Offer digital software and automation to people, Businesses, or their Agents.',
    label: 'SaaS / Micro-SaaS',
    templateId: 'saas-micro-saas',
    version: 1,
  },
  {
    capabilities: ['AGENT_SERVICE', 'IDENTITY_READY'],
    defaultName: 'New Agent Service',
    defaultSiteHeadline: 'Specialist Agent capability inside a real Business context.',
    description:
      'Sell bounded research, coding, design, marketing, analysis, or specialist Agent work.',
    label: 'Agent-as-a-Service',
    templateId: 'agent-as-a-service',
    version: 1,
  },
  {
    capabilities: ['ONCHAIN_SERVICE', 'ARC_READY'],
    defaultName: 'New Web3 Business',
    defaultSiteHeadline: 'Digital services grounded in observable onchain activity.',
    description:
      'Build onchain analytics, monitoring, accounting, verification, or settlement services.',
    label: 'Web3-native Digital Business',
    templateId: 'web3-native-digital',
    version: 1,
  },
] as const;

export type BusinessTemplate = (typeof businessTemplates)[number];
export type BusinessTemplateId = BusinessTemplate['templateId'];

export const alphaFixtureProfiles = [
  {
    businessTemplateId: 'api-data-compute',
    capabilities: [
      {
        capabilityId: 'arc-market-snapshot',
        description: 'Returns a deterministic Arc Testnet market and network snapshot.',
        kind: 'DATA_API',
      },
    ],
    defaultName: 'Signal Forge',
    dependencies: [],
    description: 'A data business that sells normalized Arc Testnet signal snapshots.',
    templateId: 'signal-forge',
    version: 1,
  },
  {
    businessTemplateId: 'saas-micro-saas',
    capabilities: [
      {
        capabilityId: 'commerce-readiness-brief',
        description: 'Produces an operational brief from an authenticated Arc signal snapshot.',
        kind: 'AUTOMATION_SERVICE',
      },
    ],
    defaultName: 'Ops Pilot',
    dependencies: ['arc-market-snapshot'],
    description: 'An automation business that consumes data before producing an operational brief.',
    templateId: 'ops-pilot',
    version: 1,
  },
] as const;

export type AlphaFixtureProfile = (typeof alphaFixtureProfiles)[number];
export type AlphaFixtureProfileId = AlphaFixtureProfile['templateId'];
export type BusinessTemplateReferenceId = BusinessTemplateId | AlphaFixtureProfileId;

// Retained for the accepted Alpha bootstrap and regression scripts.
export const alphaBusinessTemplates = alphaFixtureProfiles;
export type AlphaBusinessTemplate = AlphaFixtureProfile;
export type AlphaBusinessTemplateId = AlphaFixtureProfileId;

export function getBusinessTemplate(templateId: BusinessTemplateId): BusinessTemplate {
  const template = businessTemplates.find((candidate) => candidate.templateId === templateId);

  if (template === undefined) {
    throw new Error(`Unknown Business template: ${templateId}.`);
  }

  return template;
}

export function getBusinessTemplateDefinition(
  templateId: BusinessTemplateReferenceId,
): BusinessTemplate | AlphaFixtureProfile {
  const template = [...businessTemplates, ...alphaFixtureProfiles].find(
    (candidate) => candidate.templateId === templateId,
  );

  if (template === undefined) {
    throw new Error(`Unknown Business template reference: ${templateId}.`);
  }

  return template;
}

export function isBusinessTemplateReferenceId(value: string): value is BusinessTemplateReferenceId {
  return [...businessTemplates, ...alphaFixtureProfiles].some(
    (candidate) => candidate.templateId === value,
  );
}

export function isBusinessTemplateId(value: string): value is BusinessTemplateId {
  return businessTemplates.some((candidate) => candidate.templateId === value);
}

export function getDefaultSiteHeadline(templateId: BusinessTemplateReferenceId): string {
  const template = getBusinessTemplateDefinition(templateId);
  return 'defaultSiteHeadline' in template ? template.defaultSiteHeadline : template.defaultName;
}

export function getProductTemplateId(
  templateId: BusinessTemplateReferenceId,
): BusinessTemplateId {
  const fixture = alphaFixtureProfiles.find((candidate) => candidate.templateId === templateId);
  return fixture?.businessTemplateId ?? (templateId as BusinessTemplateId);
}
