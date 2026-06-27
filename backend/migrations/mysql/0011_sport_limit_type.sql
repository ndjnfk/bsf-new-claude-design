-- BSF2020 — Sport Limit sections: per-user limits now vary by market type
-- (TOSS / MARKET / FANCY / BOOKMAKER) for each sport, matching the reference SL
-- dialog. Adds a `type` column and widens the primary key to include it.
USE bsf2020;

ALTER TABLE sport_limits
  ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'MARKET' AFTER sport_id,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (user_id, sport_id, type);

INSERT INTO schema_version (version) VALUES (11)
ON DUPLICATE KEY UPDATE version = version;
