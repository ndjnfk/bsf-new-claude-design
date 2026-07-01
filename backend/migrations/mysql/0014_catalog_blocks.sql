-- BSF2020 — Phase 3 (block cascade): per-tier blocks on catalog items. A block
-- placed by a user hides that sport/series/match/market from its ENTIRE downline.
-- Visibility is resolved by walking the ancestor chain (see catalog.AncestorBlockedIDs).
USE bsf2020;

CREATE TABLE IF NOT EXISTS catalog_blocks (
  user_id    BIGINT UNSIGNED NOT NULL,            -- the panel that placed the block
  item_type  VARCHAR(16)     NOT NULL,            -- 'sport' | 'series' | 'match' | 'market'
  item_id    VARCHAR(64)     NOT NULL,            -- sport_id / series_id / match_id / market_id
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_type, item_id),
  KEY idx_cb_type_item (item_type, item_id),
  CONSTRAINT fk_cb_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO schema_version (version) VALUES (14)
ON DUPLICATE KEY UPDATE version = version;
