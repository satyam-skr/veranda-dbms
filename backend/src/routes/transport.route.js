import express from "express";
import multer from "multer";
import { verifyRole } from "../middlewares/authMiddleware.js";
import {
  addBusHandler,
  listBusesHandler,
  addDriverHandler,
  updateBusHandler,       // ✅ Add this line
  deleteBusHandler,
  listDriversHandler,
  uploadTimetableHandler,
  listTimetablesHandler,
  setBusArrivedHandler,
  clearBusArrivedHandler,
  deleteTimetableHandler,
} from "../controllers/transport.controller.js";



const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "src/uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// ✅ Buses
router.post("/bus/add", verifyRole(["super_admin"]), addBusHandler);
router.get("/bus/all", listBusesHandler);
router.put("/bus/update/:id", verifyRole(["super_admin"]), updateBusHandler);
router.delete("/bus/:id", deleteBusHandler);
router.delete("/bus/:id", verifyRole(["super_admin"]), deleteBusHandler);
// ✅ Drivers
router.post("/driver/add", verifyRole(["super_admin"]), addDriverHandler);
router.get("/driver/all", listDriversHandler);

// ✅ Timetables
router.post(
  "/timetable/upload",
  verifyRole(["super_admin"]),
  upload.single("timetableImage"),
  uploadTimetableHandler
);
router.get("/timetable/all", listTimetablesHandler);

// ✅ DELETE protected
router.delete("/timetable/:id", verifyRole(["super_admin"]), deleteTimetableHandler);

// ✅ Bus arrival controls
router.post("/bus/arrived", verifyRole(["super_admin"]), setBusArrivedHandler);
router.post("/bus/reset", verifyRole(["super_admin"]), clearBusArrivedHandler);

export default router;
