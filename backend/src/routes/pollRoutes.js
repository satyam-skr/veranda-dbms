import { Router } from "express";
import { submitPollRequest, approvePollRequest } from "../controllers/pollRequestController.js";
import { listPolls, getPollById } from "../controllers/pollController.js";
import { votePoll } from "../controllers/voteController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Poll request routes
router.post("/requests", requireAuth, requireRole(["student"]), submitPollRequest);
router.patch("/requests/:id/status", requireAuth, requireRole(["shop", "superAdmin"]), approvePollRequest);

// Poll access routes
router.get("/", requireAuth, listPolls);
router.get("/:id", requireAuth, getPollById);

// Voting route
router.post("/votes", requireAuth, requireRole(["student"]), votePoll);

export default router;
