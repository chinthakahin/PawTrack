// @desc    Identify animal species and health condition using Google Gemini API (Supports OAuth AQ Tokens)
// @route   POST /api/ai/identify
// @access  Public
exports.identifyAnimal = async (req, res, next) => {
  try {
    let token =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.REACT_APP_GEMINI_API_KEY;

    if (!token) {
      return res.status(500).json({
        success: false,
        error: 'Gemini Token is missing in environment variables.',
      });
    }

    // Clean up spaces and quotes
    token = token.trim().replace(/^["']|["']$/g, '');

    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Image data is required.' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const promptText = `
      Analyze this animal image for a Stray Animal Tracking System.
      Provide the response strictly as a raw JSON object with NO extra text:
      {
        "species": "Name of the animal species and estimated breed",
        "healthCondition": "Observed physical condition/health status (Injured, Healthy, Malnourished, etc.)",
        "keyFeatures": ["feature 1", "feature 2"],
        "summary": "Short 2-sentence description of what is seen"
      }
    `;

    // Detect if this is an OAuth Token (AQ...) or an API Key (AIza...)
    const isAccessToken = token.startsWith('AQ');
    
    // Set the endpoint accordingly
    const endpoint = isAccessToken
      ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${token}`;

    const headers = { 'Content-Type': 'application/json' };
    
    // If it's an AQ token, we MUST send it as a Bearer Auth header
    if (isAccessToken) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    const apiData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: apiData.error?.message || 'Google API request failed. Token might be expired.',
        details: apiData,
      });
    }

    const rawText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(500).json({
        success: false,
        error: 'No text response received from Gemini model.',
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    } catch (parseErr) {
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON response received from AI model.',
        raw: rawText,
      });
    }

    return res.status(200).json({
      success: true,
      activeModel: 'gemini-1.5-flash (REST)',
      data: parsedData,
    });
  } catch (error) {
    next(error);
  }
};