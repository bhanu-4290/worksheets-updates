import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getContacts,
  getMessages,
  sendMessage,
  getUnreadCount,
} from "../controllers/chat.controller.js";

const router = Router();

router.use(authenticate);

router.get("/contacts", getContacts);
router.get("/unread-count", getUnreadCount);
router.get("/messages/:userId", getMessages);
router.post("/messages", sendMessage);

export default router;
