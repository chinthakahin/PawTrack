const express = require('express');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());

// Configure multer to store files in memory temporarily (Memory Storage)

const upload = multer({ storage: multer.memoryStorage() });

// Initialize the Gemini AI client using the API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Create a POST route to handle the incoming data
app.post('/api/analyze-rescue', upload.single('animalImage'), async (req, res) => {
    try {
        // Get the description from the user or use a default message
        const userDescription = req.body.description || "No description provided.";
        const file = req.file;

        // Validation: Check if the file exists
        if (!file) {
            return res.status(400).json({ error: "Image is required to analyze the situation." });
        }

        // Prompt Design: Giving clear instructions to the AI
        const prompt = `Analyze this image of a stray animal along with this user description: "${userDescription}".
        Please determine the 'Urgency Level' (Choose from: Emergency SOS, Moderate, Normal) and provide a short 'Rescue Description' summarizing the condition.
        Format the output exactly as JSON: { "urgencyLevel": "...", "rescueDescription": "..." }`;

        // Call the Gemini Multimodal Model (gemini-2.5-flash is very fast for images)
       // Call the Gemini Multimodal Model (Pro model)
      const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash', 
            contents: [
                prompt,
                {
                    inlineData: {
                        data: file.buffer.toString('base64'), // Convert image to base64 format
                        mimeType: file.mimetype
                    }
                }
            ]
        });

        // Send the AI's response back to the Frontend (Client)
        res.json({ result: response.text });

    } catch (error) {
        console.error("Error during AI analysis:", error);
        res.status(500).json({ error: "Internal Server Error occurred." });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running and listening on port 3000 🚀');
});