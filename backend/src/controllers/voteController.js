import { castVote } from "../models/voteModel.js";

export const votePoll = async (req, res) => {
  try {
    const voterId = req.user.user_id;
    const { poll_id } = req.body;

    if (!poll_id) return res.status(400).json({ error: "poll_id is required" });

    const result = await castVote(voterId, poll_id);
    if (!result) return res.status(409).json({ message: "Already voted" });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
