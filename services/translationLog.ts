import { db } from "../db/index.js";
import { translationLogs } from "../db/schema.js";

export interface LogTranslationParams {
  userId: number;
  sourceText: string;
  translatedText: string | undefined;
  targetLanguage: string;
  model: string;
  tokenCount: number | undefined;
  latencyMs: number;
}

export async function logTranslation(params: LogTranslationParams) {
  try {
    await db.insert(translationLogs).values({
      userId: params.userId,
      sourceText: params.sourceText,
      translatedText: params.translatedText,
      targetLanguage: params.targetLanguage,
      model: params.model,
      tokenCount: params.tokenCount,
      latencyMs: params.latencyMs,
    });
  } catch (error) {
    console.error("Failed to log translation:", error);
  }
}
