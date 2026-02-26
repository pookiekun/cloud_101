-- HUNT TABLE FIX SCRIPT
-- Run these in Supabase SQL Editor one section at a time

-- ============================================
-- STEP 1: CHECK IF TABLES EXIST
-- ============================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'hunt%'
ORDER BY table_name;

-- If you DON'T see 'hunt_questions' in the list, run STEP 2

-- ============================================
-- STEP 2: CREATE MISSING TABLES (run if hunt_questions is missing)
-- ============================================

-- Hunt questions table
CREATE TABLE IF NOT EXISTS hunt_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES hunt_sessions(id) ON DELETE CASCADE,
  hunter_id UUID REFERENCES profiles(user_id) NOT NULL,
  component_id TEXT NOT NULL,
  component_name TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hunt responses table
CREATE TABLE IF NOT EXISTS hunt_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES hunt_questions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(user_id) NOT NULL,
  card_id UUID REFERENCES hunt_cards(id),
  was_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: DISABLE RLS ON ALL HUNT TABLES (temporary fix)
-- ============================================
ALTER TABLE hunt_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_board DISABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_events DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: VERIFY RLS IS DISABLED
-- ============================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'hunt%'
ORDER BY tablename;

-- If rowsecurity = false for all tables, you're good!

-- ============================================
-- STEP 5: CREATE INDEXES (for performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hunt_questions_session ON hunt_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_hunt_responses_question ON hunt_responses(question_id);
