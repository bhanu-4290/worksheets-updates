import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  togglePin,
} from "../controllers/announcement.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getAnnouncements);
router.post("/", createAnnouncement);
router.delete("/:id", deleteAnnouncement);
router.patch("/:id/pin", togglePin);

export default router;
