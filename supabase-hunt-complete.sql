-- CLOUD 101 - Complete Hunt Game Mode Schema
-- Apply this to your Supabase database via SQL Editor
-- This includes all tables for single sessions AND multi-session events

-- ============================================
-- HUNT SESSIONS (Base Tables)
-- ============================================

-- Hunt sessions
CREATE TABLE IF NOT EXISTS hunt_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  architecture_id SMALLINT NOT NULL CHECK (architecture_id IN (1, 2)),
  organizer_id UUID REFERENCES profiles(user_id) NOT NULL,
  session_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('lobby', 'active', 'complete')) DEFAULT 'lobby',
  current_hunter_id UUID REFERENCES profiles(user_id),
  winner TEXT CHECK (winner IN (NULL, 'crew', 'imposter')),
  event_id UUID, -- Will reference hunt_events
  session_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hunt players (session participants)
CREATE TABLE IF NOT EXISTS hunt_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES hunt_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(user_id) NOT NULL,
  is_imposter BOOLEAN DEFAULT FALSE,
  is_organizer BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- Hunt cards dealt to players
CREATE TABLE IF NOT EXISTS hunt_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES hunt_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(user_id) NOT NULL,
  component_id TEXT NOT NULL,
  component_name TEXT NOT NULL,
  is_imposter_card BOOLEAN DEFAULT FALSE,
  brief_text TEXT,
  icon TEXT,
  status TEXT CHECK (status IN ('available', 'placed', 'discarded')) DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hunt board (placed components during game)
CREATE TABLE IF NOT EXISTS hunt_board (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES hunt_sessions(id) ON DELETE CASCADE,
  card_id UUID REFERENCES hunt_cards(id),
  placed_by_player_id UUID REFERENCES profiles(user_id) NOT NULL,
  component_id TEXT NOT NULL,
  component_name TEXT NOT NULL,
  is_imposter_card BOOLEAN NOT NULL,
  placement_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hunt questions/responses tracking
CREATE TABLE IF NOT EXISTS hunt_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES hunt_sessions(id) ON DELETE CASCADE,
  hunter_id UUID REFERENCES profiles(user_id) NOT NULL,
  component_id TEXT NOT NULL,
  component_name TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hunt_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES hunt_questions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(user_id) NOT NULL,
  card_id UUID REFERENCES hunt_cards(id),
  was_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HUNT EVENTS (Multi-Session Support)
-- ============================================

-- Hunt events (container for multiple sessions)
CREATE TABLE IF NOT EXISTS hunt_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  organizer_id UUID REFERENCES profiles(user_id) NOT NULL,
  event_code TEXT UNIQUE NOT NULL,
  max_players_per_session INTEGER DEFAULT 10,
  architecture_id SMALLINT CHECK (architecture_id IN (1, 2)),
  status TEXT CHECK (status IN ('setup', 'active', 'complete')) DEFAULT 'setup',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for event_id
ALTER TABLE hunt_sessions ADD CONSTRAINT fk_hunt_sessions_event 
  FOREIGN KEY (event_id) REFERENCES hunt_events(id) ON DELETE CASCADE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE hunt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_events ENABLE ROW LEVEL SECURITY;

-- Sessions Policies
CREATE POLICY "Anyone can view hunt sessions"
  ON hunt_sessions FOR SELECT USING (true);

CREATE POLICY "Organizers can create sessions"
  ON hunt_sessions FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their sessions"
  ON hunt_sessions FOR UPDATE USING (auth.uid() = organizer_id);

-- Players Policies
CREATE POLICY "Players can view players in their sessions"
  ON hunt_players FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM hunt_players WHERE player_id = auth.uid()
    )
  );

CREATE POLICY "Players can join sessions"
  ON hunt_players FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Cards Policies
CREATE POLICY "Players can only view their own cards"
  ON hunt_cards FOR SELECT USING (player_id = auth.uid());

-- Board Policies
CREATE POLICY "Players can view board in their sessions"
  ON hunt_board FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM hunt_players WHERE player_id = auth.uid()
    )
  );

-- Questions Policies
CREATE POLICY "Players can view questions in their sessions"
  ON hunt_questions FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM hunt_players WHERE player_id = auth.uid()
    )
  );

-- Responses Policies
CREATE POLICY "Players can view responses in their sessions"
  ON hunt_responses FOR SELECT
  USING (
    question_id IN (
      SELECT id FROM hunt_questions WHERE session_id IN (
        SELECT session_id FROM hunt_players WHERE player_id = auth.uid()
      )
    )
  );

-- Events Policies
CREATE POLICY "Anyone can view hunt events"
  ON hunt_events FOR SELECT USING (true);

CREATE POLICY "Organizers can create events"
  ON hunt_events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their events"
  ON hunt_events FOR UPDATE USING (auth.uid() = organizer_id);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_hunt_players_session ON hunt_players(session_id);
CREATE INDEX IF NOT EXISTS idx_hunt_cards_session_player ON hunt_cards(session_id, player_id);
CREATE INDEX IF NOT EXISTS idx_hunt_board_session ON hunt_board(session_id);
CREATE INDEX IF NOT EXISTS idx_hunt_questions_session ON hunt_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_hunt_events_organizer ON hunt_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_hunt_sessions_event ON hunt_sessions(event_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate unique 6-character session code
CREATE OR REPLACE FUNCTION generate_hunt_session_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate unique 4-character event code
CREATE OR REPLACE FUNCTION generate_hunt_event_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
