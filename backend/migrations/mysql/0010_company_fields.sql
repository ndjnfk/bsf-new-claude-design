-- BSF2020 — Phase 15: full Create-Company/Create-Child fields (doc "Create Company").
USE bsf2020;

ALTER TABLE users
  ADD COLUMN allow_deposit_withdraw TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN is_partnership         TINYINT(1)   NOT NULL DEFAULT 1,
  ADD COLUMN reference              VARCHAR(191) NULL,
  ADD COLUMN create_no_of_child     INT          NOT NULL DEFAULT 1000000,
  ADD COLUMN allow_bet_delete       TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN allow_result_declare   TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN allow_result_revoke    TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN casino_limit           DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN remarks                VARCHAR(255) NULL;

INSERT INTO schema_version (version) VALUES (10)
ON DUPLICATE KEY UPDATE version = version;
