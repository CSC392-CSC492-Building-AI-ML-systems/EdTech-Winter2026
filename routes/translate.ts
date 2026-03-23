import express from "express";
import { getTranslationHistory } from "../controllers/translate.js";

const router = express.Router();

router.get("/history", getTranslationHistory);

export default router;
