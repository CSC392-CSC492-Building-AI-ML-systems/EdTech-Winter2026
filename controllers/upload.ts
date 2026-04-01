import type { Request, Response } from "express";
import { extractTextFromPdf, deleteFile } from "../services/pdf.js";
import { translateContent, translateContentStream } from "../services/cohere.js";
import { logTranslation } from "../services/translation_log.js";

const DEFAULT_MODEL = "command-a-translate-08-2025";

export const uploadPdfFile = async (req: Request, res: Response) => {
    const filePath = req.file?.path;

    try {
        if (!req.file || !filePath) {
            return res.status(400).json({ error: "No PDF file uploaded" });
        }

        const targetLanguage = (req.body.language as string) || "French";
        const extractedText = await extractTextFromPdf(filePath);

        if (!extractedText.trim()) {
            return res.status(422).json({ error: "Could not extract text from PDF. The file may be image-based or empty." });
        }

        const start = Date.now();
        const { text: translatedText, tokenCount } = await translateContent(extractedText, targetLanguage);
        const latencyMs = Date.now() - start;

        if (req.apiKey) {
            try {
                await logTranslation({
                    userId: req.apiKey.user_id,
                    sourceText: extractedText,
                    translatedText: translatedText ?? undefined,
                    targetLanguage,
                    model: DEFAULT_MODEL,
                    tokenCount: tokenCount ?? undefined,
                    latencyMs,
                });
            } catch (logErr) {
                console.error("Failed to log PDF translation:", logErr);
            }
        }

        return res.status(200).json({
            originalName: req.file.originalname,
            targetLanguage,
            extractedText,
            translatedText,
        });
    } catch (err) {
        console.error("PDF processing error:", err);
        return res.status(500).json({ error: "Failed to process PDF" });
    } finally {
        if (filePath) {
            await deleteFile(filePath);
        }
    }
};

export const uploadPdfFileStream = async (req: Request, res: Response) => {
    const filePath = req.file?.path;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
        if (!req.file || !filePath) {
            sendEvent('error', { error: "No PDF file uploaded" });
            return res.end();
        }

        const targetLanguage = (req.body.language as string) || "French";

        sendEvent('status', { step: 'extracting' });
        const extractedText = await extractTextFromPdf(filePath);

        if (!extractedText.trim()) {
            sendEvent('error', { error: "Could not extract text from PDF. The file may be image-based or empty." });
            return res.end();
        }

        sendEvent('extracted', { 
            originalName: req.file.originalname,
            targetLanguage,
            extractedText 
        });

        sendEvent('status', { step: 'translating' });

        const start = Date.now();
        let fullTranslation = '';
        const { tokenCount } = await translateContentStream(extractedText, targetLanguage, (token) => {
            fullTranslation += token;
            sendEvent('token', { token });
        });
        const latencyMs = Date.now() - start;

        if (req.apiKey) {
            try {
                await logTranslation({
                    userId: req.apiKey.user_id,
                    sourceText: extractedText,
                    translatedText: fullTranslation || undefined,
                    targetLanguage,
                    model: DEFAULT_MODEL,
                    tokenCount: tokenCount ?? undefined,
                    latencyMs,
                });
            } catch (logErr) {
                console.error("Failed to log streamed PDF translation:", logErr);
            }
        }

        sendEvent('complete', {});
        res.end();
    } catch (err) {
        console.error("PDF processing error:", err);
        sendEvent('error', { error: "Failed to process PDF" });
        res.end();
    } finally {
        if (filePath) {
            await deleteFile(filePath);
        }
    }
};
