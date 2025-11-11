// ✅ Create Auto

import pool from "../db/db.js";
import {
  createAuto,
  getAllAutos,
  updateAuto,
  deleteAuto,
  getAllAutoTimetables,
  updateAutoStatus,
  
} from "../models/auto.model.js";



export const addAutoHandler = async (req, res) => {
  try {
    console.log("🔹 Incoming Auto Data:", req.body);
    const auto = await createAuto(req.body);
    res.status(201).json({ success: true, data: auto });
  } catch (err) {
    console.error("❌ Error adding auto:", err);
    res.status(500).json({ success: false, message: "Error adding auto" });
  }
};


// ✅ Get All Autos
export const listAutosHandler = async (req, res) => {
  try {
    const autos = await getAllAutos();
    res.status(200).json({ success: true, data: autos });
  } catch (err) {
    console.error("Error fetching autos:", err);
    res.status(500).json({ success: false, message: "Error fetching autos" });
  }
};

// ✅ Update Auto
export const updateAutoHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateAuto(id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("Error updating auto:", err);
    res.status(500).json({ success: false, message: "Error updating auto" });
  }
};

// ✅ Delete Auto
export const deleteAutoHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteAuto(id);
    res.status(200).json({ success: true, message: "Auto deleted successfully" });
  } catch (err) {
    console.error("Error deleting auto:", err);
    res.status(500).json({ success: false, message: "Error deleting auto" });
  }
};

// ✅ Upload Auto Timetable
export const uploadAutoTimetableHandler = async (req, res) => {
  try {
    const { auto_id } = req.body;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    if (!auto_id || !imagePath)
      return res.status(400).json({ success: false, message: "Auto ID or image missing" });

    const timetable = await addAutoTimetable({ auto_id, image_path: imagePath });
    res.status(201).json({ success: true, data: timetable });
  } catch (err) {
    console.error("Error uploading auto timetable:", err);
    res.status(500).json({ success: false, message: "Error uploading auto timetable" });
  }
};

// ✅ Get All Auto Timetables
export const listAutoTimetablesHandler = async (req, res) => {
  try {
    const timetables = await getAllAutoTimetables();
    res.status(200).json({ success: true, data: timetables });
  } catch (err) {
    console.error("Error fetching auto timetables:", err);
    res.status(500).json({ success: false, message: "Error fetching auto timetables" });
  }
};

// ✅ Update Auto Status (e.g., "At Gate", "Left Gate")


// ✅ Update Auto Status (e.g., "At Gate", "Left Gate")
export const updateAutoStatusHandler = async (req, res) => {
  try {
    const { auto_id, status } = req.body;

    if (!auto_id || !status) {
      return res.status(400).json({
        success: false,
        message: "auto_id and status are required",
      });
    }

    const result = await pool.query(
      `UPDATE transport_autos 
       SET status = $1, status_updated_at = NOW() 
       WHERE auto_id = $2 
       RETURNING *`,
      [status, auto_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Auto not found" });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error updating auto status:", err);
    res.status(500).json({ success: false, message: "Error updating auto status" });
  }
};
