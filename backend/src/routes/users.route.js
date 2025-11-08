import express from "express";
import { signup, login } from "../controllers/users.controller.js";
// import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", signup);
router.post("/login", login);

router.get("/profile", (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

export default router;
