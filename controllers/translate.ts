import type { Request, Response } from "express";
import { translateBatch } from "../services/cohere.js";
import { logTranslation, getTranslationStatsFromDb } from "../services/translation_log.js";

const DEFAULT_MODEL = 'command-a-03-2025';

interface BatchTranslateBody {
  items: { id: string; text: string }[];
  targetLanguage: string;
  gradeLevel?: string;
}

export const batchTranslate = async (
  req: Request<object, object, BatchTranslateBody>,
  res: Response,
) => {
  try {
    const { items, targetLanguage, gradeLevel } = req.body;

    if (!targetLanguage || typeof targetLanguage !== "string") {
      res
        .status(400)
        .json({ error: "targetLanguage is required and must be a string" });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res
        .status(400)
        .json({ error: "items must be a non-empty array of { id, text } objects" });
      return;
    }

    for (const item of items) {
      if (
        !item ||
        typeof item.id !== "string" ||
        typeof item.text !== "string"
      ) {
        res.status(400).json({
          error:
            "Each item must have a string 'id' and a string 'text' property",
        });
        return;
      }
    }

    if (gradeLevel !== undefined && typeof gradeLevel !== "string") {
      res
        .status(400)
        .json({ error: "gradeLevel must be a string if provided" });
      return;
    }

    const start = Date.now();
    const results = await translateBatch(items, targetLanguage, gradeLevel);
    const latencyMs = Date.now() - start;

    res.status(200).json({ results });

    if (req.apiKey) {
      for (const item of items) {
        const result = results[item.id];
        if (result) {
          logTranslation({
            userId: req.apiKey.user_id,
            sourceText: item.text,
            translatedText: result.translatedText ?? undefined,
            targetLanguage,
            model: DEFAULT_MODEL,
            tokenCount: result.tokenCount ?? undefined,
            latencyMs,
          }).catch((err) => console.error("Failed to log translation:", err));
        }
      }
    }
  } catch (error) {
    console.error("Batch translation error:", error);
    res.status(500).json({ error: "Failed to perform batch translation" });
  }
};

export const getTranslationStats = async (_req: Request, res: Response) => {
  try {
    const stats = await getTranslationStatsFromDb();
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching translation stats:", error);
    return res.status(500).json({ error: "Failed to fetch translation stats" });
  }
};
