import express from "express";
import { getClassesByTeacherId } from "../controllers/classrooms.js";

const router = express.Router();

router.get("/teacher/:teacherId", getClassesByTeacherId);

export default router;
