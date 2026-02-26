-- CLOUD 101 Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- PROFILES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  profile_picture_url TEXT,
  connection_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ==============================================
-- CONNECTIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id UUID REFERENCES profiles(id) NOT NULL,
  user_b_id UUID REFERENCES profiles(id) NOT NULL,
  challenge_id INTEGER NOT NULL,
  connection_method TEXT CHECK (connection_method IN ('qr_scan', 'manual_code')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  CONSTRAINT unique_connection UNIQUE (user_a_id, user_b_id),
  CONSTRAINT no_self_connection CHECK (user_a_id != user_b_id)
);

-- ==============================================
-- BINGO GRID TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS bingo_grid (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index < 25),
  challenge_id INTEGER,
  connection_id UUID REFERENCES connections(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  CONSTRAINT unique_user_slot UNIQUE (user_id, slot_index)
);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_grid ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Connections Policies
CREATE POLICY "Users can view connections they're part of"
  ON connections FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = user_a_id OR id = user_b_id
    )
  );

CREATE POLICY "Users can create connections"
  ON connections FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = user_a_id OR id = user_b_id
    )
  );

-- Bingo Grid Policies
CREATE POLICY "Users can view own grid"
  ON bingo_grid FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = bingo_grid.user_id
    )
  );

CREATE POLICY "Users can insert own grid slots"
  ON bingo_grid FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = bingo_grid.user_id
    )
  );

CREATE POLICY "Users can update own grid slots"
  ON bingo_grid FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = bingo_grid.user_id
    )
  );

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function to validate connection code
CREATE OR REPLACE FUNCTION validate_connection_code(code TEXT)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  linkedin_url TEXT,
  profile_picture_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.full_name, p.linkedin_url, p.profile_picture_url
  FROM profiles p
  WHERE p.connection_code = UPPER(code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bingo_grid updated_at
CREATE TRIGGER update_bingo_grid_updated_at
  BEFORE UPDATE ON bingo_grid
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- REALTIME
-- ==============================================

-- Enable realtime for connections table
ALTER PUBLICATION supabase_realtime ADD TABLE connections;

-- Enable realtime for bingo_grid table
ALTER PUBLICATION supabase_realtime ADD TABLE bingo_grid;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_connection_code ON profiles(connection_code);
CREATE INDEX IF NOT EXISTS idx_connections_user_a_id ON connections(user_a_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_b_id ON connections(user_b_id);
CREATE INDEX IF NOT EXISTS idx_bingo_grid_user_id ON bingo_grid(user_id);
CREATE INDEX IF NOT EXISTS idx_bingo_grid_connection_id ON bingo_grid(connection_id);
