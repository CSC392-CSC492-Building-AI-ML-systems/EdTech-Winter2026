import express from "express";
import {
  generate,
  getById,
  list,
  update,
  deactivate,
} from "../controllers/templates.js";

const router = express.Router();

router.post("/generate", generate);
router.get("/", list);
router.get("/:id", getById);
router.patch("/:id", update);
router.delete("/:id", deactivate);

export default router;
