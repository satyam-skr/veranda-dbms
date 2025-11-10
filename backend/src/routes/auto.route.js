import express from "express";
import multer from "multer";
import { verifyRole } from "../middlewares/authMiddleware.js";
import {
  addAutoHandler,
  listAutosHandler,
  updateAutoHandler,
  deleteAutoHandler,
  uploadAutoTimetableHandler,
  listAutoTimetablesHandler,
  updateAutoStatusHandler,
} from "../controllers/auto.controller.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "src/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// ✅ Routes
router.post("/add", verifyRole(["super_admin"]), addAutoHandler);
router.get("/all", listAutosHandler);
router.put("/update/:id", verifyRole(["super_admin"]), updateAutoHandler);
router.delete("/:id", verifyRole(["super_admin"]), deleteAutoHandler);


router.post(
  "/timetable/upload",
  verifyRole(["super_admin"]),
  upload.single("timetableImage"),
  uploadAutoTimetableHandler
);
router.get("/timetable/all", listAutoTimetablesHandler);
router.post("/status/update", verifyRole(["super_admin"]), updateAutoStatusHandler);
export default router;
