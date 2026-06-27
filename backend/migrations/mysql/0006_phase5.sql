-- BSF2020 — Phase 5: series catalog + match activation.
USE bsf2020;

CREATE TABLE IF NOT EXISTS series (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sport_id   BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(191) NOT NULL,
  is_manual  TINYINT(1)   NOT NULL DEFAULT 0,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_series_sport (sport_id),
  CONSTRAINT fk_series_sport FOREIGN KEY (sport_id) REFERENCES sports (id)
) ENGINE=InnoDB;

INSERT INTO series (sport_id, name, is_manual, active) VALUES
  (4, 'ICC World Cup 2026', 0, 1),
  (4, 'IPL 2026',           0, 1),
  (1, 'La Liga 2026',       0, 1);

-- Match activation flag + optional link to a series.
ALTER TABLE matches ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN series_id BIGINT UNSIGNED NULL;

INSERT INTO schema_version (version) VALUES (6)
ON DUPLICATE KEY UPDATE version = version;
