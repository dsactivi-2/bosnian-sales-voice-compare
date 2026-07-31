-- Voice Compare D1 schema v7 (additive — safe over existing)
-- Rollback: new tables can be dropped; ratings/voice_profiles stay intact.

CREATE TABLE IF NOT EXISTS ratings (
  voice_id TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  pron INTEGER NOT NULL DEFAULT 0,
  prof INTEGER NOT NULL DEFAULT 0,
  warm INTEGER NOT NULL DEFAULT 0,
  clar INTEGER NOT NULL DEFAULT 0,
  emo INTEGER NOT NULL DEFAULT 0,
  comment TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (voice_id, reviewer)
);
CREATE INDEX IF NOT EXISTS ratings_reviewer_idx ON ratings (reviewer);
CREATE INDEX IF NOT EXISTS ratings_updated_idx ON ratings (updated_at);

CREATE TABLE IF NOT EXISTS voice_profiles (
  voice_id TEXT PRIMARY KEY,
  opening_tags TEXT NOT NULL DEFAULT '',
  objection_tags TEXT NOT NULL DEFAULT '',
  close_tags TEXT NOT NULL DEFAULT '',
  pace_note TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

-- v7: users (main + testers)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tester', -- main | tester
  token TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS users_token_idx ON users (token);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

-- v7: archive votes (2-of-3 main users)
CREATE TABLE IF NOT EXISTS archive_votes (
  voice_id TEXT NOT NULL,
  voter TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (voice_id, voter)
);
CREATE INDEX IF NOT EXISTS archive_votes_voice_idx ON archive_votes (voice_id);

CREATE TABLE IF NOT EXISTS archived_voices (
  voice_id TEXT PRIMARY KEY,
  archived_at INTEGER NOT NULL,
  voters_json TEXT NOT NULL DEFAULT '[]'
);

-- v7: audit / delete history
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  voice_id TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_ts_idx ON audit_log (ts);

-- app version meta (optional)
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
