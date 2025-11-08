// src/middleware/auth.js

// TEMPORARY AUTH MIDDLEWARE FOR TESTING
// This should be replaced with real JWT-based auth in production.

export const requireAuth = (req, res, next) => {
  const userId = req.header("x-user-id");
  const role = req.header("x-role");

  if (!userId || !role) {
    return res.status(401).json({ error: "Unauthorized: Missing x-user-id or x-role header" });
  }

  req.user = {
    user_id: Number(userId),
    role,
  };

  next();
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};
