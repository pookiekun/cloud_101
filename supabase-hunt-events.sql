-- Hunt Events for Multiple Concurrent Sessions
-- Allows organizers to create events with multiple Hunt sessions

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

-- Update hunt_sessions to reference events (optional)
ALTER TABLE hunt_sessions ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES hunt_events(id);
ALTER TABLE hunt_sessions ADD COLUMN IF NOT EXISTS session_name TEXT;

-- Enable RLS
ALTER TABLE hunt_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Anyone can view hunt events"
  ON hunt_events FOR SELECT
  USING (true);

CREATE POLICY "Organizers can create events"
  ON hunt_events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their events"
  ON hunt_events FOR UPDATE
  USING (auth.uid() = organizer_id);

-- Function to generate unique event code
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hunt_events_organizer ON hunt_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_hunt_sessions_event ON hunt_sessions(event_id);
