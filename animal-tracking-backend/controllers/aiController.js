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
        error: 'API Key is missing in environment variables.',
      });
    }

    apiKey = apiKey.trim().replace(/^["']|["']$/g, '');

    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Image data is required' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const formattedMime = mimeType || 'image/jpeg';

    // Stricter prompt to force JSON only
    const promptText = `
      Analyze this animal image for a Stray Animal Tracking & Care System.
      You MUST output ONLY a valid raw JSON object. Do not include markdown code blocks (\`\`\`json). Do not include introductory or concluding text.
      Strict JSON Format:
      {
        "species": "Name of the animal species and estimated breed",
        "healthCondition": "Observed physical condition/health status (Injured, Healthy, Malnourished, etc.)",
        "keyFeatures": ["feature 1", "feature 2"],
        "summary": "Short 2-sentence description of what is seen"
      }
    `;

    let candidateModels = [];
    try {
      const modelsRes = await fetch('[https://openrouter.ai/api/v1/models](https://openrouter.ai/api/v1/models)');
      const modelsJson = await modelsRes.json();

      if (modelsJson.data && Array.isArray(modelsJson.data)) {
        candidateModels = modelsJson.data
          .filter((m) => {
            const isFree = m.id.endsWith(':free') || m.pricing?.prompt === '0';
            const modality = m.architecture?.modality || '';
            const isVision =
              modality.includes('image') ||
              modality.includes('multimodal') ||
              m.id.includes('vision') ||
              m.id.includes('gemini') ||
              m.id.includes('vl') ||
              m.id.includes('pixtral');
            return isFree && isVision;
          })
          .map((m) => m.id);
      }
    } catch (e) {
      console.warn('Dynamic fetch failed, using fallback list');
    }

    if (candidateModels.length === 0) {
      candidateModels = [
        'meta-llama/llama-3.2-11b-vision-instruct:free',
        'qwen/qwen-2-vl-72b-instruct:free',
        'google/gemini-2.0-flash-exp:free',
      ];
    }

    let rawText = null;
    let usedModel = '';

    for (const modelName of candidateModels) {
      try {
        const response = await fetch('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': '[https://pawtrack.app](https://pawtrack.app)',
            'X-Title': 'PawTrack',
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
                      url: `data:${formattedMime};base64,${cleanBase64}`,
                    },
                  },
                ],
              },
            ],
          }),
        });

        const apiData = await response.json();

        if (response.ok && apiData.choices?.[0]?.message?.content) {
          rawText = apiData.choices[0].message.content;
          usedModel = modelName;
          break;
        }
      } catch (err) {
        // Continue to next model if this one fails
      }
    }

    if (!rawText) {
      return res.status(500).json({
        success: false,
        error: 'All free vision models failed to respond.',
      });
    }

    let parsedData;
    try {
      // Robust JSON Extraction: Strip markdown and find { ... }
      let cleanText = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      const startIndex = cleanText.indexOf('{');
      const endIndex = cleanText.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1) {
        cleanText = cleanText.substring(startIndex, endIndex + 1);
      }

      parsedData = JSON.parse(cleanText);
    } catch (parseErr) {
      // If it STILL fails, send the raw text back so we can see what the model outputted
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON response received from AI model.',
        rawAIOutput: rawText // Helps debugging!
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