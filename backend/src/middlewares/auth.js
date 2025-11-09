// src/middlewares/auth.js
import pool from "../db/db.js"; // make sure this default-exports the pg Pool

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Auth middleware:
 * - reads x-user-id (UUID)
 * - loads user from Neon
 * - attaches full user row to req.user
 *
 * Remove reliance on x-role. Roles come from DB boolean flags now.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const userId = req.header("x-user-id");

    if (!userId) {
      return res.status(401).json({ error: "Missing x-user-id header" });
    }
    if (!UUID_RE.test(userId)) {
      return res.status(400).json({ error: "Invalid x-user-id (must be UUID)" });
    }

    const { rows } = await pool.query(
      `
      SELECT
        user_id,
        email,
        full_name,
        is_active,
        -- boolean role flags:
        is_student,
        is_shopadmin,
        is_transportadmin,
        is_maintenanceadmin,
        is_superadmin,
        is_olxadmin,
        verification_status
      FROM users
      WHERE user_id = $1
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = rows[0];

    if (user.is_active === false) {
      return res.status(403).json({ error: "User is deactivated" });
    }

    req.user = user; // attach the loaded user to the request
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Auth middleware failed" });
  }
};

/**
 * Guard for a single boolean flag column in users table
 * e.g. requireFlag('is_student')
 */
export const requireFlag = (flagName) => (req, res, next) => {
  try {
    if (!req.user || req.user[flagName] !== true) {
      console.log(flagName,"-false");
      return res.status(403).json({ error: `${flagName}-false` });
    }
    next();
  } catch (err) {
    console.error("requireFlag error:", err);
    res.status(500).json({ error: "Authorization failed" });
  }
};

/**
 * Guard for ANY of several boolean flags
 * e.g. requireAnyFlag('is_shopadmin','is_superadmin')
 */
export const requireAnyFlag = (...flags) => (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
    const ok = flags.some((f) => req.user[f] === true);
    if (!ok) return res.status(403).json({ error: "Forbidden" });
    next();
  } catch (err) {
    console.error("requireAnyFlag error:", err);
    res.status(500).json({ error: "Authorization failed" });
  }
};

/**
 * Optional: ensure user is verified (if you need this somewhere)
 * (Adjust values to match your verification_status)
 */
export const requireVerified = (allowed = ["Verified", "verified"]) => (
  req,
  res,
  next
) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
    if (!allowed.includes(req.user.verification_status)) {
      return res.status(403).json({ error: "Account not verified" });
    }
    next();
  } catch (err) {
    console.error("requireVerified error:", err);
    res.status(500).json({ error: "Authorization failed" });
  }
};
