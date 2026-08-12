const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Identify animal species and health condition using Gemini AI
// @route   POST /api/ai/identify
// @access  Public
exports.identifyAnimal = async (req, res, next) => {
  try {
    // Retrieve API key from environment variables (with fallback)
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.REACT_APP_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API Key is missing in environment variables.',
      });
    }

    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Image data is required' });
    }

    // Initialize Google AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure model using dynamic latest model alias
    const selectedModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
    const model = genAI.getGenerativeModel({
      model: selectedModel,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
      Analyze this animal image for a Stray Animal Tracking & Care System.
      Provide the response in raw JSON format with the following keys:
      {
        "species": "Name of the animal species and estimated breed",
        "healthCondition": "Observed physical condition/health status (Injured, Healthy, Malnourished, etc.)",
        "keyFeatures": ["feature 1", "feature 2"],
        "summary": "Short 2-sentence description of what is seen"
      }
    `;

    // Strip data URI prefix if present (e.g. "data:image/jpeg;base64,")
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    let parsedData;
    try {
      parsedData = JSON.parse(responseText.replace(/```json|```/g, '').trim());
    } catch (parseErr) {
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON response received from AI model.',
        raw: responseText,
      });
    }

    return res.status(200).json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    next(error);
  }
};