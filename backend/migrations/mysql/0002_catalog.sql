-- BSF2020 — catalog tables owned by the sports module.
USE bsf2020;

CREATE TABLE IF NOT EXISTS sports (
  id         BIGINT UNSIGNED NOT NULL PRIMARY KEY,   -- legacy sport ids preserved
  name       VARCHAR(64)  NOT NULL,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  is_betfair TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO sports (id, name, active, is_betfair) VALUES
  (4, 'Cricket', 1, 1),
  (1, 'Soccer',  1, 1),
  (2, 'Tennis',  1, 1),
  (7, 'Casino',  1, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name);

CREATE TABLE IF NOT EXISTS matches (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sport_id   BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(191) NOT NULL,
  start_time TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status     VARCHAR(16)  NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_matches_sport (sport_id, start_time),
  CONSTRAINT fk_matches_sport FOREIGN KEY (sport_id) REFERENCES sports (id)
) ENGINE=InnoDB;

INSERT INTO schema_version (version) VALUES (2)
ON DUPLICATE KEY UPDATE version = version;
