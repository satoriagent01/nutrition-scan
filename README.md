# Nutrition Scan

A free, ad-free web app to photograph food labels, extract nutritional information via AI, and track your daily intake of any nutrient — calories, sodium, saturated fats, sugars, and more.

## What it does

1. **Scan** a food label (nutrition table + ingredients) with your camera or a photo
2. **Review & save** the extracted product data (nutrition per 100g/ml, ingredients)
3. **Build custom meals** by selecting products and specifying grams
4. **Track daily intake** — see aggregated totals for any nutrient across all meals

## How to run

```bash
# Serve the app (the UI imports from ../src/, so it must be served, not opened as file://)
npx serve .

# Then open http://localhost:3000/public/ in your browser
```

## How to configure the AI endpoint

Go to **Settings** (gear icon) and enter:

| Field       | Description                                      |
|-------------|--------------------------------------------------|
| API Base URL | e.g. `https://api.openai.com/v1`                |
| API Key     | Your OpenAI-compatible API key                   |
| Model       | e.g. `gpt-4o` or `gpt-4-vision-preview`         |

These are saved in your browser's `localStorage` and used when you scan a label.

If no API config is provided, the OCR module returns mock data (useful for testing).

## How to test

```bash
npm test
```

This runs the Node 24 native test suite covering all backend modules (OCR, products, meals, daily log, tracker).

## What's not done yet

- **Real AI OCR**: The OCR module falls back to mock data when no API config is provided. A real OpenAI-compatible endpoint must be configured to extract nutrition from actual photos.
- **Meal Planner**: The app logs meals and tracks nutrients but does not plan meals ahead of time.
- **User accounts / cloud sync**: All data is stored locally in `localStorage`.
- **Barcode scanning**: Only label photo OCR is supported.
- **Nutrient recommendations / goals**: No daily reference intake targets are enforced.