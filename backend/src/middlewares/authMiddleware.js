export const verifyRole = (allowedRoles = []) => {
  return (req, res, next) => {
    console.log("🧠 Incoming Headers =>", req.headers);
    const userRole = req.headers["x-user-role"];
    console.log("🔐 Role received:", userRole);

    if (!userRole) {
      return res.status(401).json({ success: false, message: "Role missing in request" });
    }

    if (!allowedRoles.includes(userRole)) {
      console.log("🚫 Forbidden! Allowed:", allowedRoles, " but got:", userRole);
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    next();
  };
};