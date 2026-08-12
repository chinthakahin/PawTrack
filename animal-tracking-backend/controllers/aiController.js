// @desc    Identify animal species and health condition using Gemini REST API
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
        error: 'Gemini Token/API Key is missing in environment variables.',
      });
    }

    token = token.trim().replace(/^["']|["']$/g, '');

    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Image data is required' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const promptText = `
      Analyze this animal image for a Stray Animal Tracking & Care System.
      Provide the response in raw JSON format with the following keys:
      {
        "species": "Name of the animal species and estimated breed",
        "healthCondition": "Observed physical condition/health status (Injured, Healthy, Malnourished, etc.)",
        "keyFeatures": ["feature 1", "feature 2"],
        "summary": "Short 2-sentence description of what is seen"
      }
    `;

    // Detect whether token is an OAuth Access Token (starts with AQ) or standard API Key (AIza)
    const isAccessToken = token.startsWith('AQ');
    const endpoint = isAccessToken
      ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${token}`;

    const headers = { 'Content-Type': 'application/json' };
    if (isAccessToken) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const googleApiResponse = await fetch(endpoint, {
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

    const apiData = await googleApiResponse.json();

    if (!googleApiResponse.ok) {
      return res.status(googleApiResponse.status).json({
        success: false,
        error: apiData.error?.message || 'Google API request failed.',
        details: apiData,
      });
    }

    const rawText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(500).json({
        success: false,
        error: 'No text response received from AI model.',
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
      data: parsedData,
    });
  } catch (error) {
    next(error);
  }
};