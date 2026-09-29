# Nutrition Scan - Specification

## Overview
A free, ad-free nutrition tracker. Users take photos of food labels (chocolate bar, juice bottle, olive oil spray, etc.). The app uses OCR + AI to extract nutritional info (calories, fats, sugars, sodium, etc.) and ingredients. Users can create custom meals by specifying grams of each product, and track their daily intake of any nutrient (calories, sodium, saturated fats, etc.).

## Data Model

### Product
A product represents a food item with its nutritional information per 100g (or per unit, e.g., ml).

- `id`: string (unique identifier)
- `name`: string (e.g., "Dark Chocolate Bar")
- `nutrients`: object containing nutritional values per 100g (or per unit):
  - `energy_kj`: number (kilojoules)
  - `energy_kcal`: number (kilocalories)
  - `fat`: number (grams)
  - `saturatedFat`: number (grams)
  - `carbohydrates`: number (grams)
  - `sugars`: number (grams)
  - `fiber`: number (grams)
  - `protein`: number (grams)
  - `salt`: number (grams)
- `ingredients`: string[] (array of ingredient strings)
- `unit`: string (e.g., "g" or "ml")

### Meal
A meal is a collection of products with specified quantities.

- `id`: string (unique identifier)
- `name`: string (e.g., "Morning Snack")
- `products`: array of objects, each containing:
  - `productId`: string (reference to a Product)
  - `grams`: number (amount in grams or ml)
- `nutrients`: object with pre-calculated total nutrients for the meal (same structure as Product.nutrients), computed from the products and their gram amounts.

### DailyLog
A daily log tracks all meals consumed on a given day.

- `date`: string (ISO date format, e.g., "2024-01-15")
- `meals`: array of full Meal objects (not just IDs), each with a `nutrients` field pre-calculated.
- `nutrients`: object with aggregated total nutrients for the day (same structure as Product.nutrients), computed from all meals in the log.

## OCR Extraction Interface

The OCR module extracts nutritional information from a product label image using an OpenAI-compatible endpoint. This module is mocked for testing purposes.

### Function
```typescript
extractNutrition(imageData: ArrayBuffer, options?: { apiUrl?: string, apiKey?: string, model?: string }): Promise<NutritionData>
```

### Parameters
- `imageData`: ArrayBuffer containing the image data of the food label.
- `options` (optional):
  - `apiUrl`: string (URL of the OpenAI-compatible API endpoint)
  - `apiKey`: string (API key for authentication)
  - `model`: string (model name to use for extraction)

### Returns
A `Promise<NutritionData>` where `NutritionData` is:
```typescript
{
  name: string;
  energy_kj: number;
  energy_kcal: number;
  fat: number;
  saturatedFat: number;
  carbohydrates: number;
  sugars: number;
  fiber: number;
  protein: number;
  salt: number;
  unit: string;
}
```

### Example
Input: An ArrayBuffer containing an image of a chocolate bar label.
Output:
```json
{
  "name": "Dark Chocolate Bar",
  "energy_kj": 2100,
  "energy_kcal": 500,
  "fat": 30,
  "saturatedFat": 18,
  "carbohydrates": 45,
  "sugars": 35,
  "fiber": 5,
  "protein": 8,
  "salt": 0.3,
  "unit": "g"
}
```

## Modules and Their Exports

### ocrModule
- `extractNutrition(imageData: ArrayBuffer, options?: { apiUrl?: string, apiKey?: string, model?: string }): Promise<NutritionData>` – calls the configured OpenAI-compatible endpoint to extract nutritional info from a product label image; returns parsed nutrition data including name and unit.

### productModule
- `createProduct(name: string, nutrients: NutrientData, ingredients: string[], unit: string): Product` – creates a product record with nutritional info per 100g (or per unit); returns the product object.
- `calculateNutrientsForGrams(nutrients: NutrientData, grams: number): NutrientData` – calculates nutrient values for a given number of grams based on per-100g values; pure function.

### mealModule
- `createMeal(name: string, products: Array<{productId: string, grams: number}>): Meal` – creates a meal with products and their gram amounts, pre-calculating the total nutrients; returns the meal object.

### logModule
- `addMealToLog(log: DailyLog, meal: Meal): DailyLog` – adds a meal to a daily log, aggregating nutrients; returns the updated log.
- `createDailyLog(date: string): DailyLog` – creates a new daily log for a given date; returns the log object.

### trackerModule
- `getDailyNutrientTotal(log: DailyLog, nutrient: string): number` – returns the total of a specific nutrient from a daily log; pure function.
- `getMealNutrientTotal(meal: Meal, nutrient: string): number` – returns the total of a specific nutrient from a meal; pure function.

## User Interface

### 1. Scan Screen
- **User actions**: User takes or imports a photo of a nutrition label.
- **Logic called**: `ocrModule.extractNutrition(imageData, options)`
- **Flow**: The app calls the OCR module to extract nutritional information. The user reviews the extracted data (name, nutrients, ingredients, unit) and confirms or edits it. Upon confirmation, the product is saved.

### 2. Product List Screen
- **User actions**: User views all saved products. Taps a product to see its details (nutrients per 100g/unit, ingredients).
- **Logic called**: Reads from the product storage (mocked for testing).

### 3. Meal Builder Screen
- **User actions**: User selects one or more products and specifies the grams (or ml) for each to create a custom meal. The app displays the calculated nutrition for the meal.
- **Logic called**: `mealModule.createMeal(name, products)` which internally uses `productModule.calculateNutrientsForGrams` to compute the meal's total nutrients.

### 4. Daily Log Screen
- **User actions**: User adds meals to today's log. The app shows aggregated nutrient totals for the day. The user can filter or view totals by any specific nutrient (e.g., calories, sodium, saturated fats).
- **Logic called**: `logModule.addMealToLog(log, meal)` to add meals, and `trackerModule.getDailyNutrientTotal(log, nutrient)` to retrieve specific nutrient totals.

## Acceptance Criteria

### AC-1: Product Creation with Nutritional Data
A product must be created with a name, nutrients object (energy_kj, energy_kcal, fat, saturatedFat, carbohydrates, sugars, fiber, protein, salt), ingredients array, and unit. All nutrient values are numbers representing values per 100g (or per unit).

### AC-2: OCR Extraction
The `extractNutrition` function must accept an image ArrayBuffer and optional API configuration, and return a NutritionData object with name, all nutrient fields, and unit. For testing, this function is mocked and does not call the actual API.

### AC-3: Nutrient Calculation for Grams
Given a nutrients object (per 100g) and a gram amount, the app must correctly calculate the nutrient values for that gram amount by scaling proportionally (e.g., 50g of a product with 10g fat per 100g yields 5g fat).

### AC-4: Meal Creation with Pre-calculated Nutrients
When a meal is created with products and their gram amounts, the meal's `nutrients` field must be pre-calculated as the sum of each product's nutrients scaled by their respective gram amounts.

### AC-5: Daily Log with Full Meal Objects
A daily log must store full meal objects (not just IDs) in its `meals` array, each with a pre-calculated `nutrients` field.

### AC-6: Daily Nutrient Aggregation
The daily log's `nutrients` field must be the sum of all meals' nutrients in the log.

### AC-7: Specific Nutrient Query
The app must be able to return the total of any specific nutrient (e.g., "energy_kcal", "fat", "sugars") from a daily log or meal.

### AC-8: Nutrient Field Names
All nutrient fields must use the exact names: `energy_kj`, `energy_kcal`, `fat`, `saturatedFat`, `carbohydrates`, `sugars`, `fiber`, `protein`, `salt`. No alternative names (e.g., `sodium`, `saturated_fat`) are used.

### AC-9: Ingredients as String Array
The `ingredients` field of a Product must be a `string[]`, not a single string.

### AC-10: Unit Field
A Product must have a `unit` field (e.g., "g" or "ml") indicating the unit of measurement for its nutrients.

### AC-11: OCR Module Signature
The `extractNutrition` function must have the signature `extractNutrition(imageData: ArrayBuffer, options?: { apiUrl?: string, apiKey?: string, model?: string }): Promise<NutritionData>`.

### AC-12: Pure Functions for Calculations
Nutrient calculation functions (`calculateNutrientsForGrams`, `getDailyNutrientTotal`, `getMealNutrientTotal`) must be pure functions that do not depend on external state, storage, or network calls.