# Voice Compare — Versionen & Rollback

| Version | Inhalt | Rollback |
|---------|--------|----------|
| **v6-baseline** | 89 Stimmen, 3 Reviewer, Blind, D1 Ratings (vor Upgrade) | `sh scripts/rollback-version.sh v6-baseline` |
| **v7.2.0** | Pagination 10 · Testuser/Links · 2-von-3 Archiv · Audit · Rollen | `sh scripts/rollback-version.sh v7.2.0` |

## Nach Rollback

1. `git add` + commit der wiederhergestellten Dateien  
2. In `deploy/cloudflare-worker.js` den `COMMIT`-Pin auf den Git-SHA dieses Stands setzen  
3. Worker redeployen (CF API / execute)  
4. Smoke: `/api/health` → `appVersion` + `commit` prüfen  

## D1-Hinweis

v7-Tabellen (`users`, `archive_votes`, `archived_voices`, `audit_log`) sind **additiv**.  
Rollback der UI bricht die DB nicht. Hard-Delete der Tabellen nur manuell, wenn gewünscht.
