import express from "express";
import { 
  submitIssue, 
  fetchAllIssues, 
  fetchIssueById, 
  fetchIssuesByEmail, 
  updateStatus 
} from "../controllers/issues.controller.js";

const router = express.Router();

// Submit a new issue
router.post("/submit", submitIssue);

// Get all issues (admin view)
router.get("/all", fetchAllIssues);

// Get specific issue by ID
router.get("/:id", fetchIssueById);

// Get issues by user email
router.get("/user/:email", fetchIssuesByEmail);

// Update issue status (admin action)
router.patch("/:id/status", updateStatus);

export default router;
