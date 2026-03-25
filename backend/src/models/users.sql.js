export const insertUser = `
  INSERT INTO users (name, phone, email)
  VALUES ($1, $2, $3)
  RETURNING id, name, phone, email, created_at;
`;

export const getById = `
  SELECT id, name, phone, email, created_at
  FROM users WHERE id = $1;
`;

export const listPaged = `
  SELECT id, name, phone, email, created_at
  FROM users
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2;
`;
