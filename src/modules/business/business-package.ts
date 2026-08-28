import type { BusinessInstance } from './model.ts';
import { getProductTemplateId, type BusinessTemplateId } from './templates.ts';

export interface BusinessPackage {
  readonly agents: 'CHECKPOINT_C';
  readonly businessId: BusinessInstance['businessId'];
  readonly businessSite: 'READY';
  readonly capitalProfile: 'CHECKPOINT_F';
  readonly commerceAndJobs: 'READY';
  readonly economicHistory: 'READY';
  readonly entryRoute: BusinessInstance['entryRoute'];
  readonly productTemplateId: BusinessTemplateId;
  readonly productsAndServices: 'READY';
  readonly settings: 'READY';
  readonly treasury: 'AVAILABLE';
  readonly workspace: 'READY';
}

export function createBusinessPackage(business: BusinessInstance): BusinessPackage {
  return {
    agents: 'CHECKPOINT_C',
    businessId: business.businessId,
    businessSite: 'READY',
    capitalProfile: 'CHECKPOINT_F',
    commerceAndJobs: 'READY',
    economicHistory: 'READY',
    entryRoute: business.entryRoute,
    productTemplateId: getProductTemplateId(business.templateId),
    productsAndServices: 'READY',
    settings: 'READY',
    treasury: 'AVAILABLE',
    workspace: 'READY',
  };
}
