CREATE TYPE user_role AS ENUM ('superAdmin', 'mess', 'shop', 'transport', 'maintenance', 'student');
CREATE TYPE verification_status AS ENUM ('Pending', 'Verified', 'Rejected');

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  verification_status verification_status DEFAULT 'Pending',
  role user_role DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);