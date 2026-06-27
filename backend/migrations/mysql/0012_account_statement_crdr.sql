-- BSF2020 — Add a numeric Cr/Dr indicator to the ledger so deposits and
-- withdrawals are easy to distinguish: 1 = Credit (money in, e.g. a deposit on
-- the user's row), 2 = Debit (money out, e.g. a withdraw on the user's row).
USE bsf2020;

ALTER TABLE account_statement
  ADD COLUMN crdr TINYINT NOT NULL DEFAULT 0 AFTER account_type;

-- Backfill existing rows from their credit/debit amounts.
UPDATE account_statement
  SET crdr = CASE WHEN credit > 0 THEN 1 WHEN debit > 0 THEN 2 ELSE 0 END;

INSERT INTO schema_version (version) VALUES (12)
ON DUPLICATE KEY UPDATE version = version;
