CREATE TABLE poll_requests (
  id BIGSERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE polls (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT UNIQUE NOT NULL REFERENCES poll_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE votes (
  id BIGSERIAL PRIMARY KEY,
  poll_id BIGINT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  voter_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (poll_id, voter_id) -- one vote per user per poll
);
