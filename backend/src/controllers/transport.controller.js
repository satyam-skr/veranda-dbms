import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../db/db.js";
import { io } from "../../server.js";

import {
  createBus,
  updateBus,
  getAllBuses,
  createDriver,
  getAllDrivers,
  addTimetable,
  getAllTimetables,
  markBusArrived,
  resetBusArrival,
  deleteTimetable,
  getTimetableById,
  updateBusStatus,
} from "../models/transport.model.js";

// ✅ Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



/* ---------------- BUS HANDLERS ---------------- */
export const addBusHandler = async (req, res) => {
  try {
    const bus = await createBus(req.body);
    res.status(201).json({ success: true, data: bus });
  } catch (err) {
    console.error("Error adding bus:", err);
    res.status(500).json({ success: false, message: "Error adding bus" });
  }
};

export const updateBusHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { bus_number, route_name, start_point, end_point, stops } = req.body;
    const updatedBus = await updateBus(id, {
      bus_number,
      route_name,
      start_point,
      end_point,
      stops,
    });
    res.status(200).json({ success: true, data: updatedBus });
  } catch (err) {
    console.error("Error updating bus:", err);
    res.status(500).json({ success: false, message: "Error updating bus" });
  }
};

export const listBusesHandler = async (req, res) => {
  try {
    const buses = await getAllBuses();
    res.status(200).json({ success: true, data: buses });
  } catch (err) {
    console.error("Error fetching buses:", err);
    res.status(500).json({ success: false, message: "Error fetching buses" });
  }
};

/* ---------------- DRIVER HANDLERS ---------------- */
export const addDriverHandler = async (req, res) => {
  try {
    const driver = await createDriver(req.body);
    res.status(201).json({ success: true, data: driver });
  } catch (err) {
    console.error("Error adding driver:", err);
    res.status(500).json({ success: false, message: "Error adding driver" });
  }
};

export const listDriversHandler = async (req, res) => {
  try {
    const drivers = await getAllDrivers();
    res.status(200).json({ success: true, data: drivers });
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ success: false, message: "Error fetching drivers" });
  }
};

/* ---------------- TIMETABLE HANDLERS ---------------- */
export const uploadTimetableHandler = async (req, res) => {
  try {
    const { bus_id } = req.body;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    if (!bus_id || !imagePath) {
      return res.status(400).json({
        success: false,
        message: "Bus ID or image missing",
      });
    }

    // ✅ Add record to database
    const timetable = await addTimetable({ bus_id, image_path: imagePath });

    res.status(201).json({
      success: true,
      data: timetable,
      message: "Timetable uploaded successfully",
    });
  } catch (err) {
    console.error("Error uploading timetable:", err);
    res.status(500).json({
      success: false,
      message: "Error uploading timetable",
    });
  }
};



/* ✅ DELETE TIMETABLE HANDLER */
export const deleteTimetableHandler = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🧹 Deleting timetable ID:", id);

    const timetable = await getTimetableById(id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable not found" });
    }

    const filePath = path.resolve(timetable.image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ Deleted file:", filePath);
    }

    await deleteTimetable(id);
    res.status(200).json({ success: true, message: "Timetable deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting timetable:", err);
    res.status(500).json({ success: false, message: "Error deleting timetable" });
  }
};

/* ---------------- BUS STATUS HANDLERS ---------------- */
export const setBusArrivedHandler = async (req, res) => {
  try {
    const { bus_id } = req.body;
    const bus = await markBusArrived(bus_id);
    res.status(200).json({
      success: true,
      message: "Bus marked as arrived",
      data: bus,
    });
  } catch (err) {
    console.error("Error marking arrival:", err);
    res.status(500).json({ success: false, message: "Error marking arrival" });
  }
};

export const clearBusArrivedHandler = async (req, res) => {
  try {
    const { bus_id } = req.body;
    const bus = await resetBusArrival(bus_id);
    res.status(200).json({
      success: true,
      message: "Bus status reset",
      data: bus,
    });
  } catch (err) {
    console.error("Error resetting arrival:", err);
    res.status(500).json({ success: false, message: "Error resetting arrival" });
  }
};

/* ---------------- DELETE BUS ---------------- */
export const deleteBusHandler = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑 Deleting bus with ID:", id);

    const result = await pool.query("DELETE FROM transport_buses WHERE bus_id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }

    res.status(200).json({ success: true, message: "Bus deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting bus:", err);
    res.status(500).json({ success: false, message: "Error deleting bus" });
  }
};

export const listTimetablesHandler = async (req, res) => {
  try {
    const timetables = await getAllTimetables();

    // Build full public URL for each timetable (normalizing backslashes)
    const host = `${req.protocol}://${req.get('host')}`;
    const mapped = timetables.map((row) => {
      const normalized = (row.image_path || "").replace(/\\/g, "/");
      // If image_path already starts with uploads/ use it, otherwise try to be safe
      const pathPart = normalized.startsWith("uploads/") ? normalized : `uploads/${normalized}`;
      return {
        ...row,
        public_url: `${host}/${pathPart}`
      };
    });

    res.status(200).json({ success: true, data: mapped });
  } catch (err) {
    console.error("Error fetching timetables:", err);
    res.status(500).json({ success: false, message: "Error fetching timetables" });
  }
};




export const updateBusStatusHandler = async (req, res) => {
  try {
    const { bus_id, status } = req.body;
    if (!bus_id || !status) {
      return res.status(400).json({ success: false, message: "Missing bus_id or status" });
    }

    const updatedBus = await updateBusStatus(bus_id, status);
    if (!updatedBus) {
      return res.status(404).json({ success: false, message: "Bus not found" });
    }

    // Emit realtime update 🚀
    
    io.emit("busStatusUpdated", {
      bus_id,
      status,
      status_updated_at: updatedBus.status_updated_at,
    });

    res.status(200).json({
      success: true,
      message: "Bus status updated successfully",
      data: updatedBus,
    });
  } catch (err) {
    console.error("❌ Error updating bus status:", err);
    res.status(500).json({ success: false, message: "Error updating bus status" });
  }
};
