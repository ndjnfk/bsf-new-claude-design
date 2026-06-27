-- BSF2020 — Phase 13: markets + runners catalog (Betfair / Line markets) and
-- manual-fancy fields. Powers Manage Betfair Market, Manage Session (Line) Fancy
-- and Manage Indian Fancy.
USE bsf2020;

CREATE TABLE IF NOT EXISTS markets (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  match_id      BIGINT UNSIGNED NOT NULL,
  market_id     VARCHAR(64)  NOT NULL,                 -- market code, e.g. MATCH_ODDS:1
  name          VARCHAR(191) NOT NULL,
  category      VARCHAR(16)  NOT NULL DEFAULT 'default', -- default | line
  is_manual     TINYINT(1)   NOT NULL DEFAULT 0,
  active        TINYINT(1)   NOT NULL DEFAULT 0,
  is_published  TINYINT(1)   NOT NULL DEFAULT 0,
  total_matched DECIMAL(18,2) NOT NULL DEFAULT 0,
  start_time    TIMESTAMP    NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_markets_match (match_id, category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS runners (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  market_row_id BIGINT UNSIGNED NOT NULL,
  selection_id  VARCHAR(64)  NOT NULL,
  name          VARCHAR(191) NOT NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  KEY idx_runners_market (market_row_id),
  CONSTRAINT fk_runners_market FOREIGN KEY (market_row_id) REFERENCES markets (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Manual / Indian fancy fields.
ALTER TABLE fancy ADD COLUMN selection_id VARCHAR(64) NULL;
ALTER TABLE fancy ADD COLUMN is_manual TINYINT(1) NOT NULL DEFAULT 0;

-- Seed markets + runners for the first seeded match so the pages aren't empty.
INSERT INTO markets (match_id, market_id, name, category, active, is_published) VALUES
  (1, 'MATCH_ODDS:1', 'Match Odds',        'default', 1, 1),
  (1, 'BOOKMAKER:1',  'Bookmaker',         'default', 0, 0),
  (1, 'LINE:1',       'Total Match Runs LINE', 'line', 0, 0);

INSERT INTO runners (market_row_id, selection_id, name, sort_order)
SELECT id, 'SEL-IND', 'India',     1 FROM markets WHERE market_id = 'MATCH_ODDS:1' AND match_id = 1;
INSERT INTO runners (market_row_id, selection_id, name, sort_order)
SELECT id, 'SEL-AUS', 'Australia', 2 FROM markets WHERE market_id = 'MATCH_ODDS:1' AND match_id = 1;
INSERT INTO runners (market_row_id, selection_id, name, sort_order)
SELECT id, 'SEL-DRW', 'The Draw',  3 FROM markets WHERE market_id = 'MATCH_ODDS:1' AND match_id = 1;

INSERT INTO schema_version (version) VALUES (8)
ON DUPLICATE KEY UPDATE version = version;
