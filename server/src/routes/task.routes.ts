import { Router } from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  addTaskComment,
} from "../controllers/task.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.put("/:id", updateTask);
router.post("/:id/comments", addTaskComment);

export default router;
