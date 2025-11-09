// src/routes/pollRoutes.js
import { Router } from "express";
import {
  submitPollRequest,
  approvePollRequest,
  pendingRequests,
} from "../controllers/pollRequestController.js";
import { listPolls, getPollById } from "../controllers/pollController.js";
import { votePoll } from "../controllers/voteController.js";

// NOTE: using the DB-backed guards (no requireRole here)
import {
  requireAuth,
  requireFlag,      // e.g. requireFlag("is_student")
  requireAnyFlag,   // e.g. requireAnyFlag("is_shopadmin","is_superadmin")
} from "../middlewares/auth.js";

const router = Router();

/**
 * Poll Requests
 * - Student creates a poll request
 * - Shop/SuperAdmin lists pending
 * - Shop/SuperAdmin approves/rejects
 */
router.post("/requests", requireAuth, requireFlag("is_student"), submitPollRequest);
router.get(
  "/requests/pending",
  requireAuth,
  requireAnyFlag("is_shopadmin", "is_superadmin"),
  pendingRequests
);
router.patch(
  "/requests/:id/status",
  requireAuth,
  requireAnyFlag("is_shopadmin", "is_superadmin"),
  approvePollRequest
);

/**
 * Polls & Voting
 * - Anyone authenticated: list polls
 * - Student votes (keep /votes BEFORE /:id)
 * - Anyone authenticated: poll details/results
 */
router.get("/", requireAuth, listPolls);
router.post("/votes", requireAuth, requireFlag("is_student"), votePoll);
router.get("/:id", requireAuth, getPollById);

export default router;
