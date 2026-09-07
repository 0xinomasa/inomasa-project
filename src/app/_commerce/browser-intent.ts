export interface BrowserEconomicIntent {
  readonly agentPrincipalId: string | null;
  readonly businessSlug: string;
  readonly kind: 'ERC8183_JOB' | 'X402_PURCHASE';
  readonly offerId: string;
  readonly requestId: string;
}

interface IntentStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function storageKey(input: Omit<BrowserEconomicIntent, 'requestId'>): string {
  return `inomasa:economic-intent:v1:${encodeURIComponent(input.businessSlug)}:${encodeURIComponent(input.offerId)}:${input.kind}:${encodeURIComponent(input.agentPrincipalId ?? 'human')}`;
}

function isSameIntent(
  value: unknown,
  expected: Omit<BrowserEconomicIntent, 'requestId'>,
): value is BrowserEconomicIntent {
  if (typeof value !== 'object' || value === null) return false;
  const intent = value as Partial<BrowserEconomicIntent>;
  return (
    intent.agentPrincipalId === expected.agentPrincipalId &&
    intent.businessSlug === expected.businessSlug &&
    intent.kind === expected.kind &&
    intent.offerId === expected.offerId &&
    typeof intent.requestId === 'string' &&
    requestIdPattern.test(intent.requestId)
  );
}

export function getOrCreateBrowserEconomicIntent(
  storage: IntentStorage,
  input: Omit<BrowserEconomicIntent, 'requestId'>,
  createRequestId: () => string,
): BrowserEconomicIntent {
  const key = storageKey(input);
  const stored = storage.getItem(key);
  if (stored !== null) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isSameIntent(parsed, input)) return parsed;
    } catch {
      // A malformed local value has no authority and is replaced below.
    }
  }
  const requestId = createRequestId().toLowerCase();
  if (!requestIdPattern.test(requestId)) throw new Error('Browser economic request ID is invalid.');
  const intent = { ...input, requestId };
  storage.setItem(key, JSON.stringify(intent));
  return intent;
}

export function clearBrowserEconomicIntent(
  storage: IntentStorage,
  input: BrowserEconomicIntent,
): void {
  const key = storageKey(input);
  const stored = storage.getItem(key);
  if (stored === null) return;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (isSameIntent(parsed, input) && parsed.requestId === input.requestId) {
      storage.removeItem(key);
    }
  } catch {
    storage.removeItem(key);
  }
}
