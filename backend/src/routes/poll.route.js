// src/routes/pollRoutes.js
import { Router } from "express";
import {
  submitPollRequest,
  approvePollRequest,
  pendingRequests,
} from "../controllers/pollRequest.controller.js";
import { listPolls, getPollById } from "../controllers/poll.controller.js";
import { votePoll } from "../controllers/vote.controller.js";

// NOTE: using the DB-backed guards (no requireRole here)
// import {
//   requireAuth,
//   requireFlag,      // e.g. requireFlag("is_student")
//   requireAnyFlag,   // e.g. requireAnyFlag("is_shopadmin","is_superadmin")
// } from "../middlewares/auth.js";

const router = Router();

/**
 * Poll Requests
 * - Student creates a poll request
 * - Shop/SuperAdmin lists pending
 * - Shop/SuperAdmin approves/rejects
 */
router.post("/requests", submitPollRequest);
router.get(
  "/requests/pending",
//   requireAnyFlag("is_shopadmin", "is_superadmin"),
  pendingRequests
);
router.patch(
  "/requests/:id/status",
//   requireAnyFlag("is_shopadmin", "is_superadmin"),
  approvePollRequest
);

/**
 * Polls & Voting
 * - Anyone authenticated: list polls
 * - Student votes (keep /votes BEFORE /:id)
 * - Anyone authenticated: poll details/results
 */
router.get("/",   listPolls);
router.post("/votes",   votePoll);
router.get("/:id",   getPollById);

export default router;