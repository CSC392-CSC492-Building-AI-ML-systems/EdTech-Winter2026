import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import { createHash } from "crypto";

export const createApiKey = async (req: Request, res: Response) => {
  try {

    const raw = randomBytes(32).toString('hex');
    const key = `${'mety_live'}_${raw}`;
    const hash = createHash('sha256').update(key).digest('hex');


  } catch (error) {}
};

export const getApiKeys = async (req: Request, res: Response) => {
  try {
  } catch (error) {}
};

export const getApiKeyData = async (req: Request, res: Response) => {
  try {
  } catch (error) {}
};

export const updateApiKey = async (req: Request, res: Response) => {
  try {
  } catch (error) {}
};

export const deleteApiKey = async (req: Request, res: Response) => {
  try {
  } catch (error) {}
};
