/** Next may construct request.url with localhost even when the browser uses 127.0.0.1. */
export function hasSameProductOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  try {
    const internal = new URL(request.url);
    const host = request.headers.get('host') ?? internal.host;
    const expected = new URL(`${internal.protocol}//${host}`);
    // Do not accept credentials, paths or a forwarded-host list masquerading as Host.
    if (expected.host !== host.toLowerCase() || expected.username || expected.password) return false;
    return origin === expected.origin;
  } catch {
    return false;
  }
}
