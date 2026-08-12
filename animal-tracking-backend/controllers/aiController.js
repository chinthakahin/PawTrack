const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Identify animal species and health condition using Gemini AI
// @route   POST /api/ai/identify
// @access  Public
exports.identifyAnimal = async (req, res, next) => {
  try {
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

    const genAI = new GoogleGenerativeAI(apiKey);

    // List of active models to try sequentially
    const candidateModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-8b',
      'gemini-2.0-flash-exp',
    ];

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

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    let responseText = null;
    let lastError = null;
    let usedModelName = '';

    // Try each model until generateContent succeeds
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });
        const result = await model.generateContent([prompt, imagePart]);
        responseText = result.response.text();
        if (responseText) {
          usedModelName = modelName;
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next candidate...`, err.message);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error('No compatible Gemini model succeeded.');
    }

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
      usedModel: usedModelName,
      data: parsedData,
    });
  } catch (error) {
    next(error);
  }
};