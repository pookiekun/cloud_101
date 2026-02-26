-- Fix RLS Policy for Connections Table
-- The existing policy was comparing auth.uid() with profile IDs instead of user IDs

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can view connections they're part of" ON connections;

-- Create corrected policy for INSERT
CREATE POLICY "Users can create connections"
  ON connections FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT p.user_id 
      FROM profiles p 
      WHERE p.id = user_a_id OR p.id = user_b_id
    )
  );

-- Create corrected policy for SELECT
CREATE POLICY "Users can view connections they're part of"
  ON connections FOR SELECT
  USING (
    auth.uid() IN (
      SELECT p.user_id 
      FROM profiles p 
      WHERE p.id = user_a_id OR p.id = user_b_id
    )
  );
