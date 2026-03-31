// controllers/validate.ts
import type { Request, Response } from 'express';
import { extractTextFromPdf, deleteFile } from '../services/pdf.js';
import { validateTranslation } from '../services/validate.js';

export const validateTranslationHandler = async (
  req: Request,
  res: Response
) => {
  const { targetLanguage } = req.body;

  if (!targetLanguage || typeof targetLanguage !== 'string') {
    return res.status(400).json({ error: 'targetLanguage is required and must be a string' });
  }

  const files = (req as any).files as Record<string, { path: string }[]> | undefined;
  const originalFile = files?.['original']?.[0];
  const translatedFile = files?.['translated']?.[0];

  if (!originalFile) {
    return res.status(400).json({ error: 'original PDF file is required' });
  }
  if (!translatedFile) {
    return res.status(400).json({ error: 'translated PDF file is required' });
  }

  try {
    const [originalText, translatedText] = await Promise.all([
      extractTextFromPdf(originalFile.path),
      extractTextFromPdf(translatedFile.path),
    ]);

    if (!originalText.trim()) {
        return res.status(422).json({ error: 'Could not extract text from original PDF. The file may be image-based or empty.' });
    }
    if (!translatedText.trim()) {
    return res.status(422).json({ error: 'Could not extract text from translated PDF. The file may be image-based or empty.' });
    }

    const result = await validateTranslation(originalText, translatedText, targetLanguage);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Failed to validate translation' });
  } finally {
    await Promise.all([
      deleteFile(originalFile.path),
      deleteFile(translatedFile.path),
    ]);
  }
};