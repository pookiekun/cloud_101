-- CLOUD 101 - Hunt Game Mode Schema FIX
-- Apply this to fix the infinite recursion error in hunt_players RLS policy
-- Run this in Supabase SQL Editor

-- ============================================
-- DROP OLD POLICIES (to avoid conflicts)
-- ============================================

DROP POLICY IF EXISTS "Players can view players in their sessions" ON hunt_players;
DROP POLICY IF EXISTS "Players can view board in their sessions" ON hunt_board;
DROP POLICY IF EXISTS "Players can view questions in their sessions" ON hunt_questions;
DROP POLICY IF EXISTS "Players can view responses in their sessions" ON hunt_responses;

-- ============================================
-- CREATE FIXED POLICIES (No Recursion)
-- ============================================

-- Fixed Players Policy - No recursive hunt_players query
CREATE POLICY "Players can view all players"
  ON hunt_players FOR SELECT
  USING (true);  -- Allow viewing all players (session-based filtering happens in app)

-- Fixed Board Policy - No recursion  
CREATE POLICY "Players can view all boards"
  ON hunt_board FOR SELECT
  USING (true);  -- Allow viewing all boards (session-based filtering happens in app)

-- Fixed Questions Policy - No recursion
CREATE POLICY "Players can view all questions"
  ON hunt_questions FOR SELECT
  USING (true);  -- Allow viewing all questions (session-based filtering happens in app)

-- Fixed Responses Policy - No recursion
CREATE POLICY "Players can view all responses"
  ON hunt_responses FOR SELECT
  USING (true);  -- Allow viewing all responses (session-based filtering happens in app)

-- ============================================
-- ALTERNATIVE: Session-based access without recursion
-- If you want proper RLS without recursion, uncomment this:
-- ============================================

-- DROP POLICY IF EXISTS "Players can view all players" ON hunt_players;
-- DROP POLICY IF EXISTS "Players can view all boards" ON hunt_board;
-- DROP POLICY IF EXISTS "Players can view all questions" ON hunt_questions;
-- DROP POLICY IF EXISTS "Players can view all responses" ON hunt_responses;

-- Create a helper function to check session membership
-- CREATE OR REPLACE FUNCTION is_player_in_session(session_uuid UUID)
-- RETURNS BOOLEAN AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1 FROM hunt_players 
--     WHERE session_id = session_uuid AND player_id = auth.uid()
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then use the function in policies:
-- CREATE POLICY "Players can view players in their sessions"
--   ON hunt_players FOR SELECT
--   USING (is_player_in_session(session_id));

-- CREATE POLICY "Players can view board in their sessions"
--   ON hunt_board FOR SELECT
--   USING (is_player_in_session(session_id));

-- CREATE POLICY "Players can view questions in their sessions"
--   ON hunt_questions FOR SELECT
--   USING (is_player_in_session(session_id));

-- CREATE POLICY "Players can view responses via questions"
--   ON hunt_responses FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM hunt_questions q
--       WHERE q.id = question_id AND is_player_in_session(q.session_id)
--     )
--   );
