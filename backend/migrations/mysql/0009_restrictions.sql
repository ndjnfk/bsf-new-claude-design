-- BSF2020 — Phase 14: per-user restrictions for the clients list:
-- Sport Block (SB), Sport Limit (SL), Poker Block (PB).
USE bsf2020;

CREATE TABLE IF NOT EXISTS blocked_sports (
  user_id  BIGINT UNSIGNED NOT NULL,
  sport_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, sport_id),
  CONSTRAINT fk_bs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sport_limits (
  user_id             BIGINT UNSIGNED NOT NULL,
  sport_id            BIGINT UNSIGNED NOT NULL,
  min_stake           DECIMAL(18,2) NOT NULL DEFAULT 100,
  max_stake           DECIMAL(18,2) NOT NULL DEFAULT 100000,
  max_profit          DECIMAL(18,2) NOT NULL DEFAULT 2500000,
  bet_delay           INT           NOT NULL DEFAULT 5,
  market_volume       DECIMAL(18,2) NOT NULL DEFAULT 0,
  max_market_exposure DECIMAL(18,2) NOT NULL DEFAULT 0,
  lay_diff            DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, sport_id),
  CONSTRAINT fk_sl_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS blocked_poker (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  blocked TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_bp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO schema_version (version) VALUES (9)
ON DUPLICATE KEY UPDATE version = version;
