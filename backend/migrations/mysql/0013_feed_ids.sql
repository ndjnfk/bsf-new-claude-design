-- BSF2020 — Phase 2 (feed Activate): store the third-party feed's ids on our
-- catalog rows so we can detect which feed sport/series/match/market is already
-- activated in our system (and re-sync idempotently).
USE bsf2020;

ALTER TABLE series  ADD COLUMN feed_id VARCHAR(64) NULL;
ALTER TABLE matches ADD COLUMN feed_id VARCHAR(64) NULL;
ALTER TABLE markets ADD COLUMN feed_id VARCHAR(64) NULL;

CREATE INDEX idx_series_feed  ON series  (feed_id);
CREATE INDEX idx_matches_feed ON matches (feed_id);
CREATE INDEX idx_markets_feed ON markets (feed_id);

INSERT INTO schema_version (version) VALUES (13)
ON DUPLICATE KEY UPDATE version = version;
