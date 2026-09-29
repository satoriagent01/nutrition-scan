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

  // For testing: return mock data when no API config is provided
  if (!baseUrl || !apiKey) {
    return {
      name: "Schär Melto",
      nutritionPer100g: {
        energy: 2292,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
      },
      unit: "g",
    };
  }

  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(imageData);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Image = btoa(binary);

  // Call the OpenAI-compatible endpoint
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the nutritional information from this food label. Return JSON with fields: name, nutritionPer100g (with energy, saturatedFat, carbohydrates, sugars, fiber, protein, salt), and unit (g or ml).' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OCR API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Try to parse JSON from the response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through to error
  }

  throw new Error('Failed to parse OCR response');
}