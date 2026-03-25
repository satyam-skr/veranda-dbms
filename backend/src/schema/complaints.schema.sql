CREATE TYPE complaint_category AS ENUM (
  'Mess',
  'Room',
  'Floor',
  'Internet',
  'Cleaning'
);

CREATE TYPE complaint_status AS ENUM (
  'Pending',
  'In Progress',
  'Resolved',
  'Rejected'
);

CREATE TABLE IF NOT EXISTS complaints (
  complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

  category complaint_category NOT NULL,

  issue_title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,

  status complaint_status DEFAULT 'Pending',

  assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
  admin_remarks TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);
