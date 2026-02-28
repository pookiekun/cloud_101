-- ============================================================
-- CLOUD 101 — Event Reset Script
-- Run in Supabase Dashboard → SQL Editor before each new event
--
-- THREE LEVELS — uncomment the section you need:
--   Level 1: Clear only bingo connections (keep profiles + hunt)
--   Level 2: Clear only hunt game sessions (keep profiles + bingo)
--   Level 3: Full reset — clear everything except profiles
-- ============================================================


-- ============================================================
-- LEVEL 1: Clear Bingo / Networking connections only
-- Use this when: you want a fresh round of networking
--               but keep hunt games and user accounts
-- ============================================================
TRUNCATE TABLE bingo_grid CASCADE;
TRUNCATE TABLE connections CASCADE;

SELECT
  'Bingo reset done ✅' AS status,
  (SELECT COUNT(*) FROM profiles) AS profiles_kept,
  (SELECT COUNT(*) FROM connections) AS connections_remaining,
  (SELECT COUNT(*) FROM bingo_grid) AS bingo_slots_remaining;


-- ============================================================
-- LEVEL 2: Clear Hunt game sessions only
-- Use this when: you want to run a fresh hunt game
--               but keep networking data and user accounts
-- ============================================================
-- TRUNCATE TABLE hunt_players CASCADE;
-- TRUNCATE TABLE hunt_sessions CASCADE;

-- SELECT
--   'Hunt reset done ✅' AS status,
--   (SELECT COUNT(*) FROM profiles) AS profiles_kept,
--   (SELECT COUNT(*) FROM hunt_sessions) AS sessions_remaining,
--   (SELECT COUNT(*) FROM hunt_players) AS players_remaining;


-- ============================================================
-- LEVEL 3: Full event reset (connections + hunt)
-- Keeps all user profiles and auth accounts intact.
-- Use this at the START of a brand new event day.
-- ============================================================
-- TRUNCATE TABLE hunt_players CASCADE;
-- TRUNCATE TABLE hunt_sessions CASCADE;
-- TRUNCATE TABLE bingo_grid CASCADE;
-- TRUNCATE TABLE connections CASCADE;

-- SELECT
--   'Full event reset done ✅' AS status,
--   (SELECT COUNT(*) FROM profiles) AS profiles_kept,
--   (SELECT COUNT(*) FROM connections) AS connections_now,
--   (SELECT COUNT(*) FROM bingo_grid) AS bingo_now,
--   (SELECT COUNT(*) FROM hunt_sessions) AS hunt_sessions_now;


-- ============================================================
-- NUCLEAR OPTION: Delete all user profiles too
-- (users will need to register again on next sign-in)
-- Only use this if completely starting over with new attendees.
-- ============================================================
-- TRUNCATE TABLE hunt_players CASCADE;
-- TRUNCATE TABLE hunt_sessions CASCADE;
-- TRUNCATE TABLE bingo_grid CASCADE;
-- TRUNCATE TABLE connections CASCADE;
-- TRUNCATE TABLE profiles CASCADE;
-- DELETE FROM auth.users;   -- ⚠️ removes all auth accounts too

-- SELECT 'Nuclear reset done ✅ All data cleared.' AS status;
