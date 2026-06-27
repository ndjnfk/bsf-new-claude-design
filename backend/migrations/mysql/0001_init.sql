-- BSF2020 — MySQL schema (system of record for hierarchy + money)
-- Auto-executed by the mysql container on first init.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS bsf2020 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bsf2020;

-- ---------------------------------------------------------------------------
-- roles: reference table for the 8-level hierarchy (+ helper).
-- usetype matches the legacy numeric codes for 1:1 data compatibility.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  usetype       INT          NOT NULL PRIMARY KEY,
  code          VARCHAR(32)  NOT NULL,
  name          VARCHAR(64)  NOT NULL,
  level         INT          NOT NULL,            -- 0 = top (Super Duper Admin)
  creates_usetype INT        NULL,                -- the single role this one may create
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB;

INSERT INTO roles (usetype, code, name, level, creates_usetype) VALUES
  (0,  'SUPER_DUPER_ADMIN', 'Super Duper Admin', 0, 11),
  (11, 'COMPANY',           'Company',           1, 10),
  (10, 'ADMIN',             'Admin',             2, 9),
  (9,  'SUB_ADMIN',         'Sub Admin',         3, 8),
  (8,  'SUPER_MASTER',      'Super Master',      4, 1),
  (1,  'MASTER',            'Master',            5, 2),
  (2,  'DEALER',            'Dealer',            6, 3),
  (3,  'PLAYER',            'End User (Player)', 7, NULL),
  (55, 'HELPER',            'Helper',            99, NULL)
ON DUPLICATE KEY UPDATE
  code = VALUES(code), name = VALUES(name), level = VALUES(level),
  creates_usetype = VALUES(creates_usetype);

-- ---------------------------------------------------------------------------
-- domains: website settings (doc §23).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS domains (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(191) NOT NULL,
  url           VARCHAR(255) NOT NULL,
  alternate_url VARCHAR(255) NULL,
  mobile        VARCHAR(64)  NULL,
  headline      VARCHAR(255) NULL,
  admin_headline VARCHAR(255) NULL,
  logo          VARCHAR(255) NULL,
  login_banner  VARCHAR(255) NULL,
  show_register TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_domains_url (url)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- users: the role tree + balances + share/commission + locks.
-- Self-referential parent_id builds the hierarchy. usetype -> roles.usetype.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  mstruserid               VARCHAR(64)  NOT NULL,            -- login id / username
  mstrname                 VARCHAR(191) NOT NULL,            -- display name
  password_hash            VARCHAR(255) NOT NULL,
  usetype                  INT          NOT NULL,            -- FK -> roles.usetype
  parent_id                BIGINT UNSIGNED NULL,             -- FK -> users.id
  domain_id                BIGINT UNSIGNED NULL,             -- FK -> domains.id

  -- money (kept as DECIMAL for exactness)
  balance                  DECIMAL(18,2) NOT NULL DEFAULT 0,
  exposure                 DECIMAL(18,2) NOT NULL DEFAULT 0,
  credit_limit             DECIMAL(18,2) NOT NULL DEFAULT 0,
  p_l                      DECIMAL(18,2) NOT NULL DEFAULT 0,
  profit_loss              DECIMAL(18,2) NOT NULL DEFAULT 0,
  pl                       DECIMAL(18,2) NOT NULL DEFAULT 0,
  settlement_amount        DECIMAL(18,2) NOT NULL DEFAULT 0,

  -- share %
  partner_cricket          DECIMAL(6,2)  NOT NULL DEFAULT 0,
  partner_casino           DECIMAL(6,2)  NOT NULL DEFAULT 0,

  -- commissions
  commission               DECIMAL(6,2)  NOT NULL DEFAULT 0,  -- match odds comm (to take)
  rolling_commission       DECIMAL(6,2)  NOT NULL DEFAULT 0,  -- bookmaker loss comm (to give)
  session_comm             DECIMAL(6,2)  NOT NULL DEFAULT 0,  -- session win comm (to take)
  fancy_rolling_commission DECIMAL(6,2)  NOT NULL DEFAULT 0,  -- session rolling comm (to give)

  -- security / state
  phone                    VARCHAR(32)  NULL,
  question                 VARCHAR(255) NULL,                -- helper security question
  answer_hash              VARCHAR(255) NULL,
  user_lock                TINYINT(1)   NOT NULL DEFAULT 0,  -- account locked
  bet_lock                 TINYINT(1)   NOT NULL DEFAULT 0,  -- betting locked
  password_changed         TINYINT(1)   NOT NULL DEFAULT 1,  -- 0 forces change on login
  status                   TINYINT(1)   NOT NULL DEFAULT 1,  -- 1 active, 0 inactive

  created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_users_mstruserid (mstruserid),
  KEY idx_users_parent (parent_id),
  KEY idx_users_usetype (usetype),
  KEY idx_users_domain (domain_id),
  CONSTRAINT fk_users_role   FOREIGN KEY (usetype)   REFERENCES roles (usetype),
  CONSTRAINT fk_users_parent FOREIGN KEY (parent_id) REFERENCES users (id),
  CONSTRAINT fk_users_domain FOREIGN KEY (domain_id) REFERENCES domains (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- account_statement: ledger entries (doc §15 id=3). Financial audit trail.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_statement (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  narration     VARCHAR(255) NOT NULL,
  credit        DECIMAL(18,2) NOT NULL DEFAULT 0,
  debit         DECIMAL(18,2) NOT NULL DEFAULT 0,
  balance_after DECIMAL(18,2) NOT NULL DEFAULT 0,
  account_type  TINYINT NOT NULL DEFAULT 1,  -- 1 Ledger, 2 Commission, 3 Settlement, 4 Credit Limit
  ref_id        VARCHAR(64) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_stmt_user (user_id, created_at),
  CONSTRAINT fk_stmt_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- schema_version: simple marker so we know the baseline ran.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_version (
  version    INT NOT NULL PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
INSERT INTO schema_version (version) VALUES (1)
ON DUPLICATE KEY UPDATE version = version;
