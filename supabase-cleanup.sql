-- CLOUD 101 Database Cleanup Script
-- Run this FIRST to remove all existing tables, policies, and functions
-- Then run supabase-schema.sql to recreate everything fresh

-- Drop all policies first
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view connections they're part of" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can view own grid" ON bingo_grid;
DROP POLICY IF EXISTS "Users can insert own grid slots" ON bingo_grid;
DROP POLICY IF EXISTS "Users can update own grid slots" ON bingo_grid;

-- Drop triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_bingo_grid_updated_at ON bingo_grid;

-- Drop functions
DROP FUNCTION IF EXISTS validate_connection_code(TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (cascade will remove all dependencies)
DROP TABLE IF EXISTS bingo_grid CASCADE;
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Success message
SELECT 'All tables, policies, and functions dropped successfully!' AS status;
