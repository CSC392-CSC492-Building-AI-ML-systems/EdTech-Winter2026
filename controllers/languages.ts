import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { languages } from "../db/schema.js";

interface Language {
    id: number;
    name: string;
    code: string;
}

export const availableLanguages = async (req: Request, res: Response) => {
    try {
        const allLanguages: Language[] = await db
            .select()
            .from(languages)
            .execute();
        return res.status(200).json({ languages: allLanguages });
    } catch (error) {
        console.error("Error fetching languages:", error);
        return res.status(500).json({ error: "Failed to fetch languages" });
    }
}

export const addLanguage = async (req: Request, res: Response) => {
    try {
        const { name, code } = req.body;
        if (!name || !code) {
            return res.status(400).json({ error: "Name and code are required" });
        }
        if (name.length > 255 || code.length > 16) {
            return res.status(400).json({ error: "Name or code exceeds maximum length" });
        }
        if (typeof name !== 'string' || name.trim().includes(' ') || typeof code !== 'string' || code.trim().includes(' ')) {
            return res.status(400).json({ error: "Name and code must be non-empty strings without spaces" });
        }

        const newLanguage = await db
            .insert(languages)
            .values({ name, code })
            .returning();
        return res.status(201).json({ language: newLanguage });
    } catch (error) {
        console.error("Error adding language:", error);
        return res.status(500).json({ error: "Failed to add language" });
    }
}

