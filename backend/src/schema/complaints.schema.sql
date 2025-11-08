CREATE TABLE complaints (
  complaint_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

  category VARCHAR(50) NOT NULL CHECK (
    category IN ('Mess', 'Room', 'Floor', 'Internet', 'Cleaning')
  ),

  issue_title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,

  -- priority VARCHAR(10) DEFAULT 'Medium' CHECK (
  --   priority IN ('Low', 'Medium', 'High', 'Critical')
  -- ),

  status VARCHAR(20) DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'In Progress', 'Resolved', 'Rejected')
  ),

  assigned_to INT REFERENCES users(user_id) ON DELETE SET NULL,
  admin_remarks TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);
