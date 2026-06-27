-- BSF2020 — Phase 2: match block flag + seed matches for Live Matches.
USE bsf2020;

ALTER TABLE matches ADD COLUMN blocked TINYINT(1) NOT NULL DEFAULT 0;

INSERT INTO matches (sport_id, name, start_time, status) VALUES
  (4, 'India vs Australia',        DATE_ADD(NOW(), INTERVAL 1 DAY),  'OPEN'),
  (4, 'England vs Pakistan',       DATE_ADD(NOW(), INTERVAL 2 DAY),  'OPEN'),
  (4, 'South Africa vs New Zealand', DATE_ADD(NOW(), INTERVAL 3 DAY), 'OPEN'),
  (1, 'Real Madrid vs Barcelona',  DATE_ADD(NOW(), INTERVAL 1 DAY),  'OPEN'),
  (1, 'Liverpool vs Man City',     DATE_ADD(NOW(), INTERVAL 2 DAY),  'OPEN'),
  (2, 'Djokovic vs Alcaraz',       DATE_ADD(NOW(), INTERVAL 1 DAY),  'OPEN');

INSERT INTO schema_version (version) VALUES (3)
ON DUPLICATE KEY UPDATE version = version;
