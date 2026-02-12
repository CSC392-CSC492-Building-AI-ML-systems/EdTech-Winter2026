import express from 'express';
import config from './config/config.js';
import { db } from './db/index.js';
import { users } from './db/schema.js';
import { chat, translateToFrench } from './services/cohere.js';
const { port, nodeEnv } = config;


const app = express();



app.get("/", async (req, res) => {
    try{    
            await db.insert(users).values({ email: "fa@gmail.com", name: 'fa' });
    }catch(err){
        console.error("Error inserting user:", err);    
    }
    res.status(200).send("Hello from the EdTech API!");
    
});
app.get("/translation", async (req, res) => {
    try {
        const text = req.query.text as string;
        
        console.log("Received translation request for text:", text);
        if (!text) {
            return res.status(400).json({ error: "Text parameter is required" });
        }
        
        const translatedContent = await translateToFrench(text);
        
        console.log("Original (English):", text);
        console.log("Translated (French):", translatedContent);
        
        res.status(200).json({
            originalLanguage: "English",
            targetLanguage: "French",
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;

