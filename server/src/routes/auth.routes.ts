import { Router } from "express";
import { login, logout, getMe, forgotPassword, resetPassword, changePassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { loginLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.post("/login", loginLimiter, login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticate, changePassword);

export default router;
