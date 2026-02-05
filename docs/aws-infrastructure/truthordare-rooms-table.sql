-- Truth or Dare game rooms (for "Play with others" game code feature)
-- Run this in your wordslide_game database (same as other game tables).

CREATE TABLE IF NOT EXISTS truthordare_rooms (
    id SERIAL PRIMARY KEY,
    room_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    game_code VARCHAR(10) UNIQUE NOT NULL,
    host_name VARCHAR(100) DEFAULT 'Host',
    players JSONB NOT NULL DEFAULT '[]',
    state JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_truthordare_rooms_game_code ON truthordare_rooms(game_code);
CREATE INDEX IF NOT EXISTS idx_truthordare_rooms_room_id ON truthordare_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_truthordare_rooms_updated_at ON truthordare_rooms(updated_at);

COMMENT ON TABLE truthordare_rooms IS 'Rooms for Truth or Dare multiplayer via game code';
