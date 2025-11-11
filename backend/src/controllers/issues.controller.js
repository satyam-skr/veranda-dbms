import { 
  createIssue, 
  getAllIssues, 
  getIssueById, 
  getIssuesByEmail, 
  updateIssueStatus 
} from '../models/issues.model.js';

const submitIssue = async (req, res) => {
  try {
    const { user_email, category, non_technical_type, issue_description } = req.body;

    // Validation
    if (!user_email || !category || !issue_description) {
      return res.status(400).json({ 
        error: 'Email, category, and issue description are required' 
      });
    }

    // Validate email format (IIITN email with proper prefix)
    const iiitnEmailRegex = /^(bt|mt|phd|faculty|staff)\d{2}[a-z]{3}\d{3}@iiitn\.ac\.in$/i;
    if (!iiitnEmailRegex.test(user_email)) {
      return res.status(400).json({
        error: "Invalid email format. Must be in format like bt23cse072@iiitn.ac.in"
      });
    }

    // Validate category
    if (!['technical', 'non-technical'].includes(category)) {
      return res.status(400).json({ 
        error: 'Category must be either technical or non-technical' 
      });
    }

    // If non-technical, validate the type
    if (category === 'non-technical') {
      if (!non_technical_type) {
        return res.status(400).json({ 
          error: 'Non-technical type is required for non-technical issues' 
        });
      }
      if (!['transport', 'mess', 'education'].includes(non_technical_type)) {
        return res.status(400).json({ 
          error: 'Non-technical type must be transport, mess, or education' 
        });
      }
    }

    const newIssue = await createIssue(
      user_email,
      category,
      category === 'non-technical' ? non_technical_type : null,
      issue_description
    );

    res.status(201).json({
      message: 'Issue submitted successfully',
      issue: newIssue,
    });
  } catch (err) {
    console.error('Error submitting issue:', err);
    res.status(500).json({ message: err.message });
  }
};

const fetchAllIssues = async (req, res) => {
  try {
    const issues = await getAllIssues();
    res.status(200).json({
      message: 'Issues fetched successfully',
      count: issues.length,
      issues,
    });
  } catch (err) {
    console.error('Error fetching issues:', err);
    res.status(500).json({ message: err.message });
  }
};

const fetchIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await getIssueById(id);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(200).json({
      message: 'Issue fetched successfully',
      issue,
    });
  } catch (err) {
    console.error('Error fetching issue:', err);
    res.status(500).json({ message: err.message });
  }
};

const fetchIssuesByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const issues = await getIssuesByEmail(email);

    res.status(200).json({
      message: 'User issues fetched successfully',
      count: issues.length,
      issues,
    });
  } catch (err) {
    console.error('Error fetching user issues:', err);
    res.status(500).json({ message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in-progress', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be pending, in-progress, resolved, or rejected' 
      });
    }

    const updatedIssue = await updateIssueStatus(id, status);

    if (!updatedIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(200).json({
      message: 'Issue status updated successfully',
      issue: updatedIssue,
    });
  } catch (err) {
    console.error('Error updating issue status:', err);
    res.status(500).json({ message: err.message });
  }
};

export { 
  submitIssue, 
  fetchAllIssues, 
  fetchIssueById, 
  fetchIssuesByEmail, 
  updateStatus 
};
