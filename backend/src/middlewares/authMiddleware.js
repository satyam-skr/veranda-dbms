// backend/src/middlewares/authMiddleware.js

export const verifyRole = (allowedRoles = []) => {
  return (req, res, next) => {
    // For now, role comes from headers (later from JWT)
    const userRole = req.headers["x-user-role"];

    if (!userRole) {
      return res.status(401).json({ success: false, message: "Role missing in request" });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    next();
  };
};
