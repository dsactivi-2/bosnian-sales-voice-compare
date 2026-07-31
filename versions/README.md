# Voice Compare — Versionen & Rollback

| Version | Inhalt | Rollback |
|---------|--------|----------|
| **v6-baseline** | 89 Stimmen, 3 Reviewer, Blind, D1 Ratings (vor Upgrade) | `sh scripts/rollback-version.sh v6-baseline` |
| **v7.2.0** | Pagination 10 · Testuser/Links · 2-von-3 Archiv · Audit · Rollen | `sh scripts/rollback-version.sh v7.2.0` |
| **v7.3.0** | Auto-Phonetik STT→Diff · Fish secret · Phonetik-Tab | `sh scripts/rollback-version.sh v7.3.0` |
| **v7.2.1** | Hotfix: archive.vote bind · Fehler-JSON · Tool-Version-Pin | `sh scripts/rollback-version.sh v7.2.1` |

## Nach Rollback

1. `git add` + commit der wiederhergestellten Dateien  
2. In `deploy/cloudflare-worker.js` den `COMMIT`-Pin auf den Git-SHA dieses Stands setzen  
3. Worker redeployen (CF API / execute)  
4. Smoke: `/api/health` → `appVersion` + `commit` prüfen  
5. Smoke: POST `/api/archive/vote` als Main-User muss 200 liefern  

## D1-Hinweis

v7-Tabellen (`users`, `archive_votes`, `archived_voices`, `audit_log`) sind **additiv**.  
Rollback der UI bricht die DB nicht. Hard-Delete der Tabellen nur manuell, wenn gewünscht.
