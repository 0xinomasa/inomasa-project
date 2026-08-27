# Environment and safety baseline

## B0 compatibility result

Status: `VERIFIED — PASS WITH WORKAROUND`.

B0-proven development environment:

- official Termux application on Android;
- Ubuntu ARM64 through Proot Distro;
- repository stored inside the Ubuntu filesystem, not Android shared storage;
- Node.js 22 through NVM;
- npm with the committed lockfile;
- laptop retained as a clean-clone takeover target.

Android + Termux + Ubuntu Proot is a proven environment, not an architectural or repository requirement. A laptop/PC or another suitable workstation can take over by following [`PROJECT_STATE.md`](../../PROJECT_STATE.md), installing the committed Node/npm baseline, and passing the clean-clone checks. Do not promote a new environment to `VERIFIED` until its outputs are observed.

The phone is an active development client. Local servers and agents can stop when Android kills Termux, battery policy suspends it, the application closes, or the phone powers off. Persistent deployments and event-driven background agents must run on approved hosted infrastructure in later phases.

## Execution profiles and evidence status

Environment-specific procedures are execution profiles, not universal requirements.
The engineering destination remains fixed by the active Concept & Architecture and
Alpha Realization documents, accepted checkpoint, safety constraints, acceptance
criteria, and required evidence. The route may vary across devices, operating
systems, AI tools, human operators, and infrastructure providers.

For the actual environment, choose the safest and most effective route that preserves every invariant and produces equivalent verification evidence. Prefer the least-privilege viable mode. Do not carry the Ubuntu Proot sandbox workaround, an AI-specific workflow, or a provider-specific administrative step into another profile without evidence that its constraints require it.

Use these scoped status labels:

- `VERIFIED` — the profile and stated scope actually passed the required checks with observed evidence;
- `SUPPORTED/TARGET` — expected to be viable but not yet fully proven by the relevant clean bootstrap and checks;
- `UNSUPPORTED/BLOCKED` — known not to satisfy current requirements, or awaiting a safe documented resolution.

Android + Termux + Ubuntu Proot is `VERIFIED` for the recorded B0/local scope. Its normal Codex sandbox route is `UNSUPPORTED/BLOCKED`, while the supervised trusted-repository workaround below is the proven profile. GitHub-hosted Ubuntu is separately `VERIFIED` for CI scope. Other workstations and operator/tool combinations remain `SUPPORTED/TARGET` until their own relevant evidence is observed. See [`PROJECT_STATE.md`](../../PROJECT_STATE.md) for the authoritative current status table.

## Environment separation

Use separate configuration, credentials, identifiers, endpoints, databases, wallets, contracts, and evidence for:

1. local development;
2. automated test;
3. private Arc testnet;
4. closed Arc testnet;
5. public/demo testnet;
6. production/mainnet.

Never copy production secrets into development or test. Never label testnet evidence, balances, identities, contracts, or settlement as production-authoritative.

Local convention:

- `.env.example` contains variable names and safe non-secret examples only;
- `.env.local` is ignored and should use permission mode `600`;
- environment values are validated at the application boundary once a runtime exists;
- no committed code may silently default to production endpoints.
- any `NEXT_PUBLIC_*` value is shipped to the browser and therefore must never contain a secret.
- `DATABASE_URL` is runtime access and `DATABASE_DIRECT_URL` is administrative/migration access; neither value may be committed or printed.
- non-local database URLs must explicitly require secure transport.
- an environment must never reuse another environment's database credentials or state merely for convenience.

## Safe Codex workflow on Ubuntu Proot

Codex's normal Linux sandbox failed under Ubuntu Proot during B0 even after system Bubblewrap was installed. Direct Bubblewrap execution passed, but Codex's composed sandbox failed during synthetic mount/old-root setup. Therefore the recorded workaround is:

```bash
cd /path/to/trusted/repository
git status --short
codex --sandbox danger-full-access
```

This mode removes Codex's internal filesystem and network sandbox. The process remains subject to the outer Android/Termux/Proot environment, but it can access everything available inside that environment. Consequently:

- use it only in a repository you created or fully trust;
- never launch it from `/root`, the Ubuntu home root, `/sdcard`, or a directory containing unrelated material;
- do not make `danger-full-access` a global default or committed configuration;
- never use `--dangerously-bypass-approvals-and-sandbox`;
- keep production secrets, seed phrases, private keys, and unrelated credentials out of the environment;
- constrain every task to explicit files and operations;
- review commands, diffs, and generated files before acceptance.

After each Codex session:

```bash
git status --short
git diff --check
git diff
npm run verify
```

If a normal Codex sandbox becomes compatible in a future environment, replace this workaround with the least-privilege supported mode. Laptop or another properly isolated environment remains the fallback for higher-risk work.

## OpenCode

Launch OpenCode from the repository root so it discovers `AGENTS.md` and `opencode.json`. Provider credentials are local configuration and must not be committed. OpenCode passing B0 does not authorize it to bypass repository, secret, or architecture guardrails.

Codex, OpenCode, ChatGPT, other AI tools, and human operators are interchangeable execution clients. Their workflows may differ according to actual capabilities, but they must preserve the same guardrails and produce equivalent gate evidence. None may store the only copy of a decision, gate, recovery step, or verification result. Significant accepted state belongs in GitHub `main` and `PROJECT_STATE.md`.

## Replacement-device and provider recovery

Use the clean-clone and recovery procedures in [`PROJECT_STATE.md`](../../PROJECT_STATE.md). Replacement devices must reconstruct dependencies from `package-lock.json`; database providers must be addressed through the generic PostgreSQL configuration and versioned migrations. Never transfer a credential by committing it, copying it into a tracked file, or placing it in chat.

## Network workaround

The B0 Ubuntu environment required IPv4 for some downloads. Use `curl -4` only when ordinary network access fails; do not encode it into application behavior.

On 27 August 2026, the local mobile-network resolver temporarily mapped
`api.circle.com` to an operator address whose certificate did not contain the
Circle hostname. TLS correctly failed closed. For a provider hostname mismatch:

1. do not disable certificate or hostname verification;
2. obtain a current DNSSEC-valid answer through a trusted DNS-over-HTTPS resolver;
3. validate one candidate address with `curl --resolve` and require the normal
   public trust chain plus the exact provider hostname in the certificate SAN;
4. if execution cannot wait for the local resolver to recover, use only a narrow,
   temporary hostname mapping for that provider call; and
5. remove the mapping immediately afterward and verify that no override remains.

Never commit or retain a provider edge IP: addresses and routing can change. This
is an environment-scoped recovery profile, not application behavior or permission
to bypass TLS. A mismatch that cannot be resolved with the checks above is a
mandatory stop.
