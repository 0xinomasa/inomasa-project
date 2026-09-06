'use client';

import { useState, type FormEvent } from 'react';
import type { CreationAssistance } from '../../modules/business/creation-assistance.ts';

type Template = {
  readonly templateId: string;
  readonly label: string;
  readonly description: string;
  readonly capabilities: readonly string[];
};

function capabilityLabel(capability: string): string {
  const labels: Record<string, string> = {
    ARC_READY: 'Arc-compatible structure',
    COMMERCE_READY: 'Commerce structure',
    IDENTITY_READY: 'Identity-compatible structure',
    X402_READY: 'x402-compatible structure',
  };
  return labels[capability] ?? capability.replaceAll('_', ' ').toLowerCase();
}

export function CreateBusinessForm({ templates }: { readonly templates: readonly Template[] }) {
  const [templateId, setTemplateId] = useState(templates[0]?.templateId ?? '');
  const selected = templates.find((template) => template.templateId === templateId);
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryTouched, setSummaryTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [idea, setIdea] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [assistance, setAssistance] = useState<CreationAssistance | null>(null);
  const [assistanceProof, setAssistanceProof] = useState<string | undefined>();

  async function draftBusiness() {
    setError(null);
    setDrafting(true);
    try {
      const response = await fetch('/api/product/business-proposals', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idea }),
      });
      const result = await response.json() as { error?: string; assistance?: CreationAssistance; proof?: string };
      if (!response.ok || !result.assistance || !result.proof) {
        setError(result.error ?? 'AI could not prepare a Business proposal.');
        return;
      }
      setAssistance(result.assistance);
      setAssistanceProof(result.proof);
      setDisplayName(result.assistance.proposal.displayName);
      setSummary(result.assistance.proposal.summary);
      setTemplateId(result.assistance.proposal.templateId);
      setSummaryTouched(true);
    } catch {
      setError('AI drafting is temporarily unavailable. No Business was created.');
    } finally {
      setDrafting(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/product/businesses', {
        body: JSON.stringify({ displayName, slug: slug || displayName, summary, templateId, assistanceProof }),
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
      <fieldset disabled={drafting || submitting}>
        <legend>Develop your idea with AI</legend>
        <div className="field">
          <label htmlFor="business-idea">What would you like to build?</label>
          <textarea id="business-idea" maxLength={3000} onChange={(event) => setIdea(event.target.value)} rows={4} value={idea} placeholder="Describe the people you want to serve and the problem you want to solve." />
          <small>Your idea is sent to the configured AI provider when you request a proposal. Avoid private customer data.</small>
        </div>
        <button className="button button--secondary" disabled={!idea.trim()} onClick={draftBusiness} type="button">{drafting ? 'Preparing proposal…' : 'Prepare Business proposal'}</button>
        {assistance === null ? null : (
          <div aria-live="polite" className="operational-notice">
            <strong>Review your Business proposal</strong>
            <p>{assistance.proposal.firstService}</p>
            <p>{assistance.proposal.economicReason}</p>
            <ol>{assistance.proposal.nextSteps.map((step, index) => <li key={index}>{step}</li>)}</ol>
            <p>Edit the Business details below before creating it. This proposal has not made payments or created a wallet.</p>
          </div>
        )}
        <p className="scope-note">The controlled Alpha also retains manual template creation when AI is unavailable.</p>
      </fieldset>
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
              <em>{template.capabilities.map(capabilityLabel).join(' · ')}</em>
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
        <p>Your Business opens in its Workspace. Treasury remains pending until you connect it there.</p>
        <button className="button button--primary" disabled={submitting || drafting || !templateId} type="submit">
          {submitting ? 'Creating…' : 'Create Business'}
        </button>
      </div>
    </form>
  );
}
