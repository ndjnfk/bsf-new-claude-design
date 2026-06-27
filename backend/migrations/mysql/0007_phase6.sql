-- BSF2020 — Phase 6: fancy markets, bank requests, casino GGR.
USE bsf2020;

-- Fancy/session markets (doc §27 — Set Fancy BetLimit).
CREATE TABLE IF NOT EXISTS fancy (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  match_id                  BIGINT UNSIGNED NOT NULL,
  head_name                 VARCHAR(191) NOT NULL,
  min_stake                 DECIMAL(18,2) NOT NULL DEFAULT 100,
  max_stake                 DECIMAL(18,2) NOT NULL DEFAULT 100000,
  max_session_liability     DECIMAL(18,2) NOT NULL DEFAULT 200000,
  max_session_bet_liability DECIMAL(18,2) NOT NULL DEFAULT 50000,
  message                   VARCHAR(255) NULL,
  status                    VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE|INACTIVE|SUSPEND|HIDE
  result                    VARCHAR(64)  NULL,
  created_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_fancy_match (match_id)
) ENGINE=InnoDB;

INSERT INTO fancy (match_id, head_name) VALUES
  (1, '6 Over Runs'),
  (1, '10 Over Runs'),
  (1, 'Total Match Fours');

-- Bank deposit/withdraw requests (doc §20 — Agent Bank DP/WD).
CREATE TABLE IF NOT EXISTS bank_requests (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id        BIGINT UNSIGNED NOT NULL,
  username       VARCHAR(64)  NOT NULL,
  req_type       TINYINT      NOT NULL,             -- 1 deposit, 2 withdraw
  amount         DECIMAL(18,2) NOT NULL DEFAULT 0,
  method         VARCHAR(32)  NULL,                 -- Normal | Fast
  account_name   VARCHAR(191) NULL,
  account_number VARCHAR(64)  NULL,
  ifsc           VARCHAR(32)  NULL,
  utr            VARCHAR(64)  NULL,
  remark         VARCHAR(255) NULL,
  status         VARCHAR(16)  NOT NULL DEFAULT 'PENDING',  -- PENDING|COMPLETE|REJECT|HOLD
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_req_status (status, req_type, created_at)
) ENGINE=InnoDB;

-- Casino GGR daily summary (doc §7 — Aura GGR).
CREATE TABLE IF NOT EXISTS casino_ggr (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  summary_date DATE         NOT NULL,
  label        VARCHAR(64)  NOT NULL DEFAULT 'Aura',
  net_chips    DECIMAL(18,2) NOT NULL DEFAULT 0,
  KEY idx_ggr_date (summary_date)
) ENGINE=InnoDB;

INSERT INTO casino_ggr (summary_date, label, net_chips) VALUES
  (CURDATE(),                         'Aura',  12500.00),
  (DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Aura', -4300.00),
  (DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Aura',  9800.50),
  (DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Aura',  3100.00);

INSERT INTO schema_version (version) VALUES (7)
ON DUPLICATE KEY UPDATE version = version;
