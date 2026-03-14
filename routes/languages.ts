import express from "express";
import { availableLanguages } from "../controllers/languages.js";

const router = express.Router();

router.get("/", availableLanguages);

export default router;