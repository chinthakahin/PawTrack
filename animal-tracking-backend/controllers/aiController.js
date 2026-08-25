// @desc    Identify animal species and health condition using Gemini API (Localhost - AQ Token)
// @route   POST /api/ai/identify
// @access  Public
exports.identifyAnimal = async (req, res, next) => {
  try {
    let token = process.env.GEMINI_API_KEY;

    if (!token) {
      return res.status(500).json({
        success: false,
        error: 'API Token is missing in .env file.',
      });
    }

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

    // using Google REST API direct fetch
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // This handles your AQ... token correctly!
      },
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
      activeModel: 'gemini-1.5-flash (Local)',
      data: parsedData,
    });
  } catch (error) {
    console.error("AI Controller Error:", error);
    return res.status(500).json({
      success: false,
      error: 'Server error during AI processing.',
    });
  }
};