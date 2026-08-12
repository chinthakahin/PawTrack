// @desc    Identify animal species and health condition using OpenRouter
// @route   POST /api/ai/identify
// @access  Public
exports.identifyAnimal = async (req, res, next) => {
  try {
    let apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenRouter API Key is missing in environment variables.',
      });
    }

    apiKey = apiKey.trim().replace(/^["']|["']$/g, '');

    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Image data is required' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const formattedMime = mimeType || 'image/jpeg';

    const promptText = `
      Analyze this animal image for a Stray Animal Tracking & Care System.
      Provide the response strictly as a raw JSON object with NO extra text or markdown formatting:
      {
        "species": "Name of the animal species and estimated breed",
        "healthCondition": "Observed physical condition/health status (Injured, Healthy, Malnourished, etc.)",
        "keyFeatures": ["feature 1", "feature 2"],
        "summary": "Short 2-sentence description of what is seen"
      }
    `;

    // Verified OpenRouter Free Multimodal/Vision models
    const candidateModels = [
      'google/gemini-2.0-flash-thinking-exp:free',
      'meta-llama/llama-3.2-11b-vision-instruct:free',
      'qwen/qwen-2-vl-72b-instruct:free',
      'mistralai/pixtral-12b:free'
    ];

    let rawText = null;
    let lastError = null;
    let usedModel = '';

    for (const modelName of candidateModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://pawtrack.app',
            'X-Title': 'PawTrack'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: promptText },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${formattedMime};base64,${cleanBase64}`
                    }
                  }
                ]
              }
            ]
          })
        });

        const apiData = await response.json();

        if (response.ok && apiData.choices?.[0]?.message?.content) {
          rawText = apiData.choices[0].message.content;
          usedModel = modelName;
          break;
        } else {
          lastError = apiData.error?.message || `Model ${modelName} failed.`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!rawText) {
      return res.status(500).json({
        success: false,
        error: `OpenRouter error: ${lastError || 'All free vision models failed.'}`,
      });
    }

    let parsedData;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : rawText;
      parsedData = JSON.parse(jsonStr);
    } catch (parseErr) {
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON response received from AI model.',
        raw: rawText,
      });
    }

    return res.status(200).json({
      success: true,
      activeModel: usedModel,
      data: parsedData,
    });
  } catch (error) {
    next(error);
  }
};