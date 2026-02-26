-- FORCE DISABLE RLS ON ALL HUNT TABLES
-- Run this in Supabase SQL Editor to fix "0 cards loaded" issue

BEGIN;

-- 1. Disable RLS on all tables
ALTER TABLE public.hunt_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_board DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_events DISABLE ROW LEVEL SECURITY;

-- 2. Verify settings (Result should be all 'false')
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'hunt_%';

COMMIT;
