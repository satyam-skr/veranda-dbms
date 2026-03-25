
import express from "express";
import multer from "multer";
import { verifyRole } from "../middlewares/authMiddleware.js";

import {
  addBusHandler,
  listBusesHandler,
  addDriverHandler,
  updateBusHandler,
  deleteBusHandler,
  listDriversHandler,
  uploadTimetableHandler,
  listTimetablesHandler,
  setBusArrivedHandler,
  clearBusArrivedHandler,
  deleteTimetableHandler,
} from "../controllers/transport.controller.js";

const router = express.Router();
export const listBuses = async () => {
  const query = `
    SELECT 
      bus_id, 
      bus_number, 
      route_name, 
      start_point, 
      end_point, 
      stops,
      tracking_url  -- ✅ include tracking_url in output
    FROM transport_buses
    ORDER BY bus_id ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "src/uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// ✅ Bus routes (mirror Auto structure)
router.post("/bus/add", verifyRole(["super_admin"]), addBusHandler);
router.get("/bus/all", listBusesHandler);
router.put("/bus/update/:id", verifyRole(["super_admin"]), updateBusHandler);
router.delete("/bus/:id", verifyRole(["super_admin"]), deleteBusHandler);

// ✅ Timetables
router.post(
  "/timetable/upload",
  verifyRole(["super_admin"]),
  upload.single("timetableImage"),
  uploadTimetableHandler
);
router.get("/timetable/all", listTimetablesHandler);
router.delete("/timetable/:id", verifyRole(["super_admin"]), deleteTimetableHandler);

// Bus arrival / status routes
router.post("/bus/arrived", verifyRole(["super_admin"]), setBusArrivedHandler);
router.post("/bus/reset", verifyRole(["super_admin"]), clearBusArrivedHandler);



export default router;