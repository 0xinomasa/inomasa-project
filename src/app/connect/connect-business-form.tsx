'use client';

import { useState } from 'react';
import type { ExternalBusinessManifest } from '../../modules/business/external-connection.ts';

export function ConnectBusinessForm({ sources }: { readonly sources: readonly { sourceId: string; label: string }[] }) {
  const [sourceId, setSourceId] = useState(sources[0]?.sourceId ?? '');
  const [preview, setPreview] = useState<{ manifest: ExternalBusinessManifest; manifestSha256: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'PREVIEW' | 'CONNECT') {
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/product/connections', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, sourceId, manifestSha256: preview?.manifestSha256 }),
      });
      const result = await response.json() as {
        error?: string; manifest?: ExternalBusinessManifest; manifestSha256?: string; workspacePath?: string;
      };
      if (!response.ok) { setError(result.error ?? 'Connection unavailable.'); return; }
      if (action === 'CONNECT' && result.workspacePath) window.location.assign(result.workspacePath);
      else if (result.manifest && result.manifestSha256) setPreview({ manifest: result.manifest, manifestSha256: result.manifestSha256 });
      else setError('The external Business description is unavailable.');
    } catch { setError('Connection is temporarily unavailable.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="business-create-form">
      <div className="field">
        <label htmlFor="business-source">Your configured Business source</label>
        <select disabled={busy} id="business-source" onChange={(event) => { setSourceId(event.target.value); setPreview(null); }} value={sourceId}>
          {sources.map((source) => <option key={source.sourceId} value={source.sourceId}>{source.label}</option>)}
        </select>
      </div>
      <button className="button button--secondary" disabled={busy || !sourceId} onClick={() => act('PREVIEW')} type="button">{busy ? 'Working…' : 'Read Business description'}</button>
      {preview === null ? null : (
        <section aria-live="polite" className="operational-notice">
          <h2>{preview.manifest.displayName}</h2>
          <p>{preview.manifest.summary}</p>
          <p>Connect this Business to an Inomasa workspace. Its external system and existing payments keep operating. Its new Arc payment capability starts unconfigured.</p>
          <button className="button button--primary" disabled={busy} onClick={() => act('CONNECT')} type="button">Connect Business</button>
        </section>
      )}
      {error === null ? null : <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
