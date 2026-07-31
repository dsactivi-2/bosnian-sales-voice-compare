-- Cloudflare D1 schema for voice-compare ratings
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
