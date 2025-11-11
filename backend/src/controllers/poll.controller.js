import { getActivePolls, getPollResults } from "../models/poll.model.js";

export const listPolls = async (req, res) => {
  try {
    const polls = await getActivePolls();
    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getPollById = async (req, res) => {
  try {
    const pollId = req.params.id;
    const result = await getPollResults(pollId);

    if (!result) return res.status(404).json({ error: "Poll not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};