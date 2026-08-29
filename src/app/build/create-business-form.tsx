'use client';

import { useState, type FormEvent } from 'react';

type Template = {
  readonly templateId: string;
  readonly label: string;
  readonly description: string;
  readonly capabilities: readonly string[];
};

export function CreateBusinessForm({ templates }: { readonly templates: readonly Template[] }) {
  const [templateId, setTemplateId] = useState(templates[0]?.templateId ?? '');
  const selected = templates.find((template) => template.templateId === templateId);
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryTouched, setSummaryTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/product/businesses', {
        body: JSON.stringify({ displayName, slug: slug || displayName, summary, templateId }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      const result = (await response.json()) as { readonly error?: string; readonly workspacePath?: string };
      if (!response.ok) {
        setError(result.error ?? 'Business could not be created.');
        return;
      }
      window.location.assign(result.workspacePath ?? '/app/businesses');
    } catch {
      setError('Business creation is temporarily unavailable.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="business-create-form" onSubmit={submit}>
      <fieldset>
        <legend>Choose a starting point</legend>
        <div className="template-choice-grid">
          {templates.map((template, index) => (
            <button
              aria-pressed={template.templateId === templateId}
              className={template.templateId === templateId ? 'template-choice is-selected' : 'template-choice'}
              key={template.templateId}
              onClick={() => {
                setTemplateId(template.templateId);
              }}
              type="button"
            >
              <span>0{index + 1}</span>
              <strong>{template.label}</strong>
              <small>{template.description}</small>
              <em>{template.capabilities.join(' · ').replaceAll('_', ' ')}</em>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="form-fields">
        <div className="field">
          <label htmlFor="business-name">Business name</label>
          <input id="business-name" maxLength={160} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your Business name" required value={displayName} />
        </div>
        <div className="field">
          <label htmlFor="business-slug">Workspace address</label>
          <input id="business-slug" maxLength={96} onChange={(event) => setSlug(event.target.value)} placeholder="your-business" value={slug} />
          <small>Optional. If blank, a workspace address is generated from the Business name.</small>
        </div>
        <div className="field">
          <label htmlFor="business-summary">What does it do? <span>Optional</span></label>
          <textarea id="business-summary" maxLength={500} onChange={(event) => { setSummaryTouched(true); setSummary(event.target.value); }} placeholder={selected?.description ?? 'A short description'} rows={4} value={summary} />
          <small>{summaryTouched ? 'Your description is saved as entered.' : 'Suggestion based on the selected template; edit it to describe your Business.'}</small>
        </div>
      </div>
      {error === null ? null : <p aria-live="polite" className="form-error">{error}</p>}
      <div className="form-submit-row">
        <p>Creates a BUILD Business with a pending Treasury binding in the controlled environment.</p>
        <button className="button button--primary" disabled={submitting || !templateId} type="submit">
          {submitting ? 'Creating…' : 'Create Business'}
        </button>
      </div>
    </form>
  );
}
