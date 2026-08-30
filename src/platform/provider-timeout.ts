export const externalProviderTimeoutMs = 20_000;
export const externalReadTimeoutMs = 8_000;

export class ExternalOperationTimeoutError extends Error {
  override readonly name = 'ExternalOperationTimeoutError';
}

export async function withExternalOperationTimeout<T>(
  operation: Promise<T>,
  label: string,
  timeoutMs = externalProviderTimeoutMs,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new ExternalOperationTimeoutError(
            `${label} timed out after ${timeoutMs}ms; no terminal external outcome was inferred.`,
          ));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
