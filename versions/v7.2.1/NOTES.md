# v7.2.1 — hotfix archive.vote

- Fix: `votesFor()` missing `.bind(voice_id)` → CF 1101 on POST `/api/archive/vote`
- Harden: top-level + archive.vote try/catch with JSON error detail
- Archive INSERT uses single-line SQL (safer minify)
- Rollback packs: v6-baseline, v7.2.0, v7.2.1

## Rollback
```bash
sh scripts/rollback-version.sh v7.2.0   # previous
# or
sh scripts/rollback-version.sh v6-baseline
```
Then pin COMMIT + redeploy worker.
