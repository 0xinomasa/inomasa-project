# Git workflow

## Source of truth

- Repository: private `0xinomasa/inomasa-project`
- Default branch: `main`
- `main` contains accepted engineering state and must remain buildable.

## Routine workflow

```bash
git switch main
git pull --ff-only
git status --short
git switch -c <focused-branch>
```

Make one coherent change, run `npm run verify`, inspect `git diff --check` and `git diff`, then commit with a short intent-focused message. Push the focused branch and review it before integrating into `main`.

## Project-state synchronization

`PROJECT_STATE.md` is the takeover index, not a substitute for Git history or detailed engineering documents. Update it as part of every significant gate decision or accepted phase merge whenever practical. At minimum keep these mutable fields accurate:

- latest completed gate and verdict;
- accepted merge and observed `main` CI evidence;
- open blockers, security holds, and dependency gates;
- proven environments and current external providers;
- exact next implementation checkpoint and whether execution is authorized.

The update must distinguish evidence from intent and durable rules from mutable state. Do not create an empty commit solely to restate unchanged status, but do not leave a future operator dependent on chat history after state materially changes.

## Safety rules

- Never commit secrets or generated output.
- Never force-push `main`.
- Never rewrite shared history merely to tidy it.
- Never mix architecture changes, dependency selection, and unrelated implementation in one commit.
- Preserve user changes in a dirty worktree; do not discard them to make checks pass.
- Use `git restore` only for exact, reviewed paths whose changes are known to be disposable.
- Do not use `git reset --hard` or broad cleanup commands.

## Baseline exception

The B1 bootstrap is the repository's root baseline and may be committed directly to `main` after clean verification. This does not authorize direct-to-main feature development in later phases.
