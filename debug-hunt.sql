-- Debug Hunt Game State
--Run these queries in Supabase SQL Editor to check game state

-- 1. Check all sessions and their status
SELECT id, session_code, status, current_hunter_id, architecture_id
FROM hunt_sessions
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check players in the most recent session
SELECT hp.id, hp.player_id, hp.is_imposter, p.full_name
FROM hunt_players hp
LEFT JOIN profiles p ON hp.player_id = p.user_id
WHERE hp.session_id IN (SELECT id FROM hunt_sessions ORDER BY created_at DESC LIMIT 1);

-- 3. Check cards dealt in the most recent session  
SELECT hc.id, hc.player_id, hc.component_id, hc.component_name, hc.is_imposter_card, hc.status, p.full_name
FROM hunt_cards hc
LEFT JOIN profiles p ON hc.player_id = p.user_id
WHERE hc.session_id IN (SELECT id FROM hunt_sessions ORDER BY created_at DESC LIMIT 1)
ORDER BY hc.player_id, hc.id;

-- 4. Count cards per player
SELECT hc.player_id, p.full_name, COUNT(*) as card_count
FROM hunt_cards hc
LEFT JOIN profiles p ON hc.player_id = p.user_id
WHERE hc.session_id IN (SELECT id FROM hunt_sessions ORDER BY created_at DESC LIMIT 1)
GROUP BY hc.player_id, p.full_name;
