import {createComplaint,getComplaintsByStudent,getAllComplaints} from '../models/complaints.model.js';

const submitComplaints = async(req,res) => {
    try{
        const student_id = req.user.id;
        const {category,issue_title,description,photo_url}=req.body;

        const newComplaint = await createComplaint(
            student_id,
            category,
            issue_title,
            description,
            photo_url,
        )
        res.status(201).json({ message: "Complaint submitted successfully", complaint: newComplaint });
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
}

const fetchMyComplaints = async(req,res)=>{
    try{
        const student_id = req.user.id;
        const complaints = getComplaintsByStudent(student_id);
        res.status.json({complaints,message:"successfully fetch complaints"});
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
}

const fetchAllComplaints = async(req,res)=>{
    try{
        const complaints = await getAllComplaints();
        res.json(complaints);
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
}

export {submitComplaints,fetchAllComplaints,fetchMyComplaints};