CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  affiliation VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  departure_time TIMESTAMP,
  transit_modes TEXT[],
  duration_minutes INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO locations (name, category, latitude, longitude)
VALUES
('UCI Student Center', 'Campus', 33.6495, -117.8426),
('University Town Center', 'Shopping', 33.6505, -117.8390),
('Irvine Spectrum Center', 'Shopping', 33.6503, -117.7427),
('John Wayne Airport', 'Airport', 33.6757, -117.8678),
('Tustin Metrolink Station', 'Transit Hub', 33.7317, -117.8106),
('Santa Ana Regional Transportation Center', 'Transit Hub', 33.7528, -117.8570),
('Diamond Jamboree', 'Shopping', 33.6915, -117.8350),
('South Coast Plaza', 'Shopping', 33.6906, -117.8889)
ON CONFLICT DO NOTHING;