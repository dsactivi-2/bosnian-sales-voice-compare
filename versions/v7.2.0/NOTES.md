# v7.2.0 — Phases A + B + C

- A: Pagination 10/page, filter/search/sort, save keeps page+scroll
- B: Users (main/tester), token links, Plus-button, isolation
- C: Archive 2-of-3 main votes, audit log, restore

## Rollback to v6 baseline
```bash
cp versions/v6-baseline/index.html .
cp versions/v6-baseline/config.json .
cp versions/v6-baseline/deploy/* deploy/
# set COMMIT pin to 69fe480 (or baseline commit), redeploy worker
```

## Rollback only frontend
```bash
cp versions/v6-baseline/index.html index.html public/index.html
# commit + pin + redeploy
```

D1 tables users/archive_* are additive; old UI ignores them.
