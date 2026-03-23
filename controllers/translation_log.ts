import type { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { translation_log } from "../db/schema.js";

export const getTranslationLog = async (req: Request, res: Response) => {
    try{
        const logEntries = await db
            .select()
            .from(translation_log)
            .execute();

        return res.status(200).json({ log: logEntries });
    } catch (error) {
        console.error("Error fetching translation log:", error);
        return res.status(500).json({ error: "Failed to fetch translation log" });
    }
}

export const getTranslationLogEntry = async (req: Request, res: Response) => {
    try {
        const { user_id, source_language, target_language } = req.query;

        if (!user_id && !source_language && !target_language) {
            return res.status(400).json({ error: "Provide at least one filter: user_id, source_language, or target_language" });
        }
        
        if (user_id && (typeof user_id !== 'string' || isNaN(Number(user_id)))) {
            return res.status(400).json({ error: "user_id must be a valid number" });
        }

        const conditions = [];
        if (user_id) conditions.push(eq(translation_log.userId, Number(user_id)));
        if (source_language) conditions.push(eq(translation_log.sourceLanguage, String(source_language)));
        if (target_language) conditions.push(eq(translation_log.targetLanguage, String(target_language)));

        const query = db.select().from(translation_log);
        const logEntries = await (conditions.length > 0
            ? query.where(and(...conditions))
            : query
        ).execute();

        return res.status(200).json({ log: logEntries });
    } catch (error) {
        console.error("Error fetching translation log entry:", error);
        return res.status(500).json({ error: "Failed to fetch translation log entry" });
    }
}

export const addTranslationLogEntry = async (req: Request, res: Response) => {
    try {
        const { userId, sourceLanguage, targetLanguage, originalText, translatedText, latency, cached } = req.body;

        if (
            userId === undefined ||
            !sourceLanguage ||
            !targetLanguage ||
            !originalText ||
            !translatedText ||
            latency === undefined ||
            cached === undefined
        ) {
            return res.status(400).json({ error: "Missing required fields: userId, sourceLanguage, targetLanguage, originalText, translatedText, latency, cached" });
        }

        if (isNaN(Number(userId))) {
            return res.status(400).json({ error: "userId must be a valid number" });
        }

        await db.insert(translation_log).values({
            userId: Number(userId),
            sourceLanguage: String(sourceLanguage),
            targetLanguage: String(targetLanguage),
            originalText: String(originalText),
            translatedText: String(translatedText),
            latency: Number(latency),
            cached: Boolean(cached),
            createdAt: new Date(),
        } as any).execute();

        return res.status(201).json({ message: "Translation log entry added successfully" });
    } catch (error) {
        console.error("Error adding translation log entry:", error);
        return res.status(500).json({ error: "Failed to add translation log entry" });
    }
}

export const deleteTranslationLogEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: "Invalid or missing id parameter" });
        }

        const deleteResult = await db
            .delete(translation_log)
            .where(eq(translation_log.id, Number(id)))
            .execute();

        return res.status(200).json({ message: "Translation log entry deleted successfully" });
    
    } catch (error) {
        console.error("Error deleting translation log entry:", error);
        return res.status(500).json({ error: "Failed to delete translation log entry" });
    }
}