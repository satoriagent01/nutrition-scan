/**
 * OCR module that calls an OpenAI-compatible endpoint to extract
 * nutritional information from a product label image.
 *
 * @param {ArrayBuffer} imageData - The raw image data (JPEG/PNG)
 * @param {object} [options] - Optional configuration
 * @param {string} [options.baseUrl] - Base URL of the OpenAI-compatible API
 * @param {string} [options.apiKey] - API key for authentication
 * @param {string} [options.model] - Model name to use
 * @returns {Promise<NutritionData>} Parsed nutrition facts
 */
export async function extractNutrition(imageData, options = {}) {
  const { baseUrl, apiKey, model } = options;

  if (!baseUrl || !apiKey) {
    throw new Error('baseUrl and apiKey are required');
  }

  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(imageData);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const mimeType = detectMimeType(imageData);

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition label parser. Extract nutritional information from product labels.
Return ONLY a JSON object with these fields:
- name: string (product name)
- energy_kj: number (energy in kilojoules per 100g or 100ml)
- energy_kcal: number (energy in kilocalories per 100g or 100ml)
- fat: number (total fat in grams per 100g or 100ml)
- saturatedFat: number (saturated fat in grams per 100g or 100ml)
- carbohydrates: number (total carbohydrates in grams per 100g or 100ml)
- sugars: number (sugars in grams per 100g or 100ml)
- fiber: number (fiber in grams per 100g or 100ml)
- protein: number (protein in grams per 100g or 100ml)
- salt: number (salt in grams per 100g or 100ml)
- unit: string ("g" or "ml") - the unit used in the label

If a value is not present or zero, use 0. Do not include any text outside the JSON.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the nutritional information from this product label.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OCR API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned from OCR API');
  }

  // Parse the JSON from the response
  let parsed;
  try {
    // Try to find JSON in the response (sometimes there's markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed = JSON.parse(content);
    }
  } catch (e) {
    throw new Error(`Failed to parse OCR response as JSON: ${e.message}`);
  }

  return {
    name: parsed.name || '',
    energy_kj: Number(parsed.energy_kj) || 0,
    energy_kcal: Number(parsed.energy_kcal) || 0,
    fat: Number(parsed.fat) || 0,
    saturatedFat: Number(parsed.saturatedFat) || 0,
    carbohydrates: Number(parsed.carbohydrates) || 0,
    sugars: Number(parsed.sugars) || 0,
    fiber: Number(parsed.fiber) || 0,
    protein: Number(parsed.protein) || 0,
    salt: Number(parsed.salt) || 0,
    unit: parsed.unit || 'g',
  };
}

/**
 * Detect MIME type from image data
 * @param {ArrayBuffer} imageData
 * @returns {string}
 */
function detectMimeType(imageData) {
  const bytes = new Uint8Array(imageData);
  if (bytes.length < 4) return 'image/jpeg';

  // JPEG: FF D8
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';

  return 'image/jpeg';
}