import express from 'express';
import config from './config/config.js';
import { db } from './db/index.js';
import { users } from './db/schema.js';
import { chat, translateToFrench, translateContent } from './services/cohere.js';
import { loadGlossaryCache } from './services/glossary.js';
import authRouter from './routes/auth.js';
import apiKeysRouter from './routes/api_key.js';
import { apiKeyMiddleware } from './middleware/api_key.js';
const { port, nodeEnv } = config;


const app = express();

app.use(express.json());
app.use(apiKeyMiddleware);


app.use("/api/auth", authRouter);
app.use("/api/keys", apiKeysRouter);

app.get("/test", (req, res) => {
    console.log(req.apiKey);
    res.send("Test");
})

app.get("/translation", async (req, res) => {
    try {
        const text = req.query.text as string;
        const targetLanguage = (req.query.lang as string) || "French";
        
        console.log("Received translation request for text:", text, "to:", targetLanguage);
        if (!text) {
            return res.status(400).json({ error: "Text parameter is required" });
        }
        
        const translatedContent = await translateContent(text, targetLanguage);
        
        console.log("Original (English):", text);
        console.log(`Translated (${targetLanguage}):`, translatedContent);
        
        res.status(200).json({
            originalLanguage: "English",
            targetLanguage,
            originalText: text,
            translatedText: translatedContent
        });
    } catch (err) {
        console.error("Translation error:", err);
        res.status(500).json({ error: "Failed to translate content" });
    }
});

// Sample Cohere API endpoint
app.get("/cohere/:message", async (req, res) => {
    try {
        const message = ( await req.params.message as string) || "Hello, how are you?";
        const response = await chat(message);
        res.status(200).json({ 
            message: message,
            response: response 
        });
    } catch (err) {
        console.error("Cohere API error:", err);
        res.status(500).json({ error: "Failed to get response from Cohere" });
    }
});

async function start() {
    const termCount = await loadGlossaryCache();
    console.log(`Glossary cache loaded: ${termCount} terms`);

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

start();

export default app;

