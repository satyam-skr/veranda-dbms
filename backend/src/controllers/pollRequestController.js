import { createPollRequest, getUserPollRequests, getPendingRequests, updatePollRequestStatus } from "../models/pollRequestModel.js";
import { createPoll } from "../models/pollModel.js";

export const submitPollRequest = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const { title, description } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const request = await createPollRequest(studentId, title, description);
    res.status(201).json(request);
  } catch (err) {
    if (err.message.includes("uniq_one_pending_request")) {
      return res.status(400).json({ error: "You already have a pending poll request" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const approvePollRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const decision = req.body.decision; // 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ error: "Decision must be approved or rejected" });
    }

    const updatedRequest = await updatePollRequestStatus(id, decision);
    if (!updatedRequest) return res.status(404).json({ error: "Request not found or already reviewed" });

    // Create poll if approved
    let poll = null;
    if (decision === "approved") {
      poll = await createPoll(updatedRequest);
    }

    res.json({ updatedRequest, poll });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
export const pendingRequests = async (req, res) => {
  try {
    const rows = await getPendingRequests(); // from your model
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
