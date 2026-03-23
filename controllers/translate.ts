import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { translationLogs } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import type { TranslationHistoryResponse } from "../types/translation.js";
import type { ErrorResponse } from "../types/response.js";

export const getTranslationHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.apiKey?.user_id;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "User authentication required" } as ErrorResponse);
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await db
      .select({
        id: translationLogs.id,
        sourceText: translationLogs.sourceText,
        translatedText: translationLogs.translatedText,
        targetLanguage: translationLogs.targetLanguage,
        model: translationLogs.model,
        tokenCount: translationLogs.tokenCount,
        latencyMs: translationLogs.latencyMs,
        createdAt: translationLogs.createdAt,
      })
      .from(translationLogs)
      .where(eq(translationLogs.userId, userId))
      .orderBy(desc(translationLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: db.$count(translationLogs) })
      .from(translationLogs)
      .where(eq(translationLogs.userId, userId));

    const total = countResult[0]?.count || 0;

    const response: TranslationHistoryResponse = {
      translations: logs,
      total,
      limit,
      offset,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching translation history:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch translation history" } as ErrorResponse);
  }
};
