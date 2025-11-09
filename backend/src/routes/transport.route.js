console.log("🚍 transport.route.js loaded");
import express from "express";
import multer from "multer";
import {
  addBusHandler,
  listBusesHandler,
  addDriverHandler,
  listDriversHandler,
  uploadTimetableHandler,
  listTimetablesHandler,
  setBusArrivedHandler,
  clearBusArrivedHandler
} from "../controllers/transport.controller.js";

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "src/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

router.post("/bus/add", addBusHandler);
router.get("/bus/all", listBusesHandler);

router.post("/driver/add", addDriverHandler);
router.get("/driver/all", listDriversHandler);

router.post("/timetable/upload", upload.single("timetableImage"), uploadTimetableHandler);
router.get("/timetable/all", listTimetablesHandler);

router.post("/bus/arrived", setBusArrivedHandler);
router.post("/bus/reset", clearBusArrivedHandler);

export default router;
