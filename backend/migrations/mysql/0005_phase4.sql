-- BSF2020 — Phase 4: settlement entries and helper (worker) accounts.
USE bsf2020;

CREATE TABLE IF NOT EXISTS settlement_entries (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  parent_id   BIGINT UNSIGNED NOT NULL,
  child_id    BIGINT UNSIGNED NOT NULL,
  parent_user VARCHAR(64)  NOT NULL,
  child_user  VARCHAR(64)  NOT NULL,
  amount      DECIMAL(18,2) NOT NULL DEFAULT 0,
  remark      VARCHAR(255) NULL,
  on_date     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_settle_parent (parent_id, on_date),
  CONSTRAINT fk_settle_parent FOREIGN KEY (parent_id) REFERENCES users (id),
  CONSTRAINT fk_settle_child  FOREIGN KEY (child_id)  REFERENCES users (id)
) ENGINE=InnoDB;

-- Helper / worker accounts (doc §24 — Add Worker). usetype 55.
CREATE TABLE IF NOT EXISTS helpers (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  mstruserid    VARCHAR(64)  NOT NULL,
  mstrname      VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  parent_id     BIGINT UNSIGNED NOT NULL,
  permissions   TEXT         NULL,          -- JSON array of permission keys
  question      VARCHAR(255) NULL,
  answer_hash   VARCHAR(255) NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_helpers_userid (mstruserid),
  KEY idx_helpers_parent (parent_id),
  CONSTRAINT fk_helpers_parent FOREIGN KEY (parent_id) REFERENCES users (id)
) ENGINE=InnoDB;

INSERT INTO schema_version (version) VALUES (5)
ON DUPLICATE KEY UPDATE version = version;
