import express from 'express';
import cors from 'cors';
import config from './config/config.js';
import { db } from './db/index.js';
import { users } from './db/schema.js';
import { chat } from './services/cohere.js';
import { loadGlossaryCache } from './services/glossary.js';
import authRouter from './routes/auth.js';
import apiKeysRouter from './routes/api_key.js';
import { apiKeyMiddleware } from './middleware/api_key.js';
import languagesRouter from './routes/languages.js';
import type { ErrorResponse } from './types/response.js';
const { port, nodeEnv } = config;

import translateRouter from './routes/translate.js';
import templatesRouter from './routes/templates.js';


const app = express();

app.use(cors());
app.use(express.json());

app.use(apiKeyMiddleware);

app.use("/api/auth", authRouter);
app.use("/api/keys", apiKeysRouter);
app.use("/api/languages", languagesRouter);
app.use("/api/translate", translateRouter);
app.use("/api/templates", templatesRouter);

async function start() {
    const termCount = await loadGlossaryCache();
    console.log(`Glossary cache loaded: ${termCount} terms`);

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

start();

export default app;

