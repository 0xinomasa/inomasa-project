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
