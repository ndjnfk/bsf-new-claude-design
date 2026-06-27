-- BSF2020 — Phase 3: results (declare/revoke) and global settings.
USE bsf2020;

CREATE TABLE IF NOT EXISTS results (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  match_id       BIGINT UNSIGNED NOT NULL,
  sport_id       BIGINT UNSIGNED NOT NULL,
  market_id      VARCHAR(64)  NOT NULL,
  market_name    VARCHAR(191) NULL,
  selection_name VARCHAR(191) NULL,
  declared_by    VARCHAR(64)  NULL,
  status         VARCHAR(16)  NOT NULL DEFAULT 'DECLARED',  -- DECLARED | REVOKED
  declared_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_results_match (match_id),
  KEY idx_results_sport (sport_id, declared_at)
) ENGINE=InnoDB;

-- Key/value global settings (doc §32 — Market Setting).
CREATE TABLE IF NOT EXISTS settings (
  skey       VARCHAR(64)  NOT NULL PRIMARY KEY,
  sval       TEXT         NOT NULL,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO settings (skey, sval) VALUES
  ('auto_declare',   'false'),
  ('default_stakes', '[100,500,1000,5000,10000]'),
  ('min_stake',      '100'),
  ('max_stake',      '500000'),
  ('max_profit',     '2500000')
ON DUPLICATE KEY UPDATE sval = sval;

INSERT INTO schema_version (version) VALUES (4)
ON DUPLICATE KEY UPDATE version = version;
