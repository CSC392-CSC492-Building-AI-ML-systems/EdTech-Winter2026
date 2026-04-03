import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import { getTranslationStats } from "../controllers/translate.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/stats", getTranslationStats);

export default router;
