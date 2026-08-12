const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function checkModels() {
    console.log("🔍 Checking available Google AI Models...");
    try {
        const models = await ai.models.list();
        for await (const m of models) {
            console.log("👉", m.name);
        }
        console.log("✅ Done checking!");
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkModels();