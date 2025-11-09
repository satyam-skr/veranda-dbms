import {
  createBus,
  getAllBuses,
  createDriver,
  getAllDrivers,
  addTimetable,
  getAllTimetables,
  markBusArrived,
  resetBusArrival
} from "../models/transport.model.js";


export const addBusHandler = async (req, res) => {
  try {
    const bus = await createBus(req.body);
    res.status(201).json({ success: true, data: bus });
  } catch (err) {
    console.error("Error adding bus:", err);
    res.status(500).json({ success: false, message: "Error adding bus" });
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


export const uploadTimetableHandler = async (req, res) => {
  try {
    const { bus_id } = req.body;
    const image_path = req.file ? req.file.path : null;
    if (!bus_id || !image_path) {
      return res.status(400).json({ success: false, message: "Bus ID or image missing" });
    }
    const timetable = await addTimetable({ bus_id, image_path });
    res.status(201).json({ success: true, data: timetable });
  } catch (err) {
    console.error("Error uploading timetable:", err);
    res.status(500).json({ success: false, message: "Error uploading timetable" });
  }
};


export const listTimetablesHandler = async (req, res) => {
  try {
    const timetables = await getAllTimetables();
    res.status(200).json({ success: true, data: timetables });
  } catch (err) {
    console.error("Error fetching timetables:", err);
    res.status(500).json({ success: false, message: "Error fetching timetables" });
  }
};


export const setBusArrivedHandler = async (req, res) => {
  try {
    const { bus_id } = req.body;
    const bus = await markBusArrived(bus_id);
    res.status(200).json({ success: true, message: "Bus marked as arrived", data: bus });
  } catch (err) {
    console.error("Error marking arrival:", err);
    res.status(500).json({ success: false, message: "Error marking arrival" });
  }
};


export const clearBusArrivedHandler = async (req, res) => {
  try {
    const { bus_id } = req.body;
    const bus = await resetBusArrival(bus_id);
    res.status(200).json({ success: true, message: "Bus status reset", data: bus });
  } catch (err) {
    console.error("Error resetting arrival:", err);
    res.status(500).json({ success: false, message: "Error resetting arrival" });
  }
};
