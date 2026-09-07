/** Bound streamed bodies as well as Content-Length, including chunked responses. */
export async function readBoundedJson(response: Pick<Response, 'body' | 'headers'>, maximumBytes: number): Promise<unknown> {
  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new Error('A JSON response is required.');
  }
  if (Number(response.headers.get('content-length')) > maximumBytes || response.body === null) {
    await response.body?.cancel();
    throw new Error('JSON response is unavailable or too large.');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximumBytes) throw new Error('JSON response is too large.');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}
