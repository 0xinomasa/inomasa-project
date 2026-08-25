export const alphaBusinessTemplates = [
  {
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

export type AlphaBusinessTemplate = (typeof alphaBusinessTemplates)[number];
export type AlphaBusinessTemplateId = AlphaBusinessTemplate['templateId'];

export function getAlphaBusinessTemplate(
  templateId: AlphaBusinessTemplateId,
): AlphaBusinessTemplate {
  const template = alphaBusinessTemplates.find((candidate) => candidate.templateId === templateId);

  if (template === undefined) {
    throw new Error(`Unknown Alpha Business template: ${templateId}.`);
  }

  return template;
}
