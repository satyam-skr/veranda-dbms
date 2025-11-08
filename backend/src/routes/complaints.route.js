import express from "express";
import {submitComplaints,fetchAllComplaints,fetchMyComplaints} from "../controllers/complaints.controller.js";
// import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/submit",submitComplaints);
router.get("/my",fetchMyComplaints);
router.get("/all",fetchAllComplaints);

export default router;