import { createPollRequest, getUserPollRequests, getPendingRequests, updatePollRequestStatus } from "../models/pollRequest.model.js";
import { createPoll } from "../models/poll.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const submitPollRequest = async (req, res) => {
  try {
    const { title, description } = req.body;

    // ✅ Same like bidder_id in bids
    const user_id = '73a41e0c-e6f9-43e8-b2f5-31e0e3a325b4';

    if (!title) {
      return res.status(400).json(
        new ApiResponse(400, null, "Title is required")
      );
    }

    const request = await createPollRequest(user_id, title, description);

    return res.status(201).json(
      new ApiResponse(201, request, "Poll request created successfully")
    );

  } catch (err) {
    if (err.message.includes("uniq_one_pending_request")) {
      return res.status(400).json(
        new ApiResponse(400, null, "You already have a pending poll request")
      );
    }

    console.error(err);
    return res.status(500).json(
      new ApiResponse(500, null, "Server error")
    );
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