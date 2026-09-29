# Nutrition Scan - Product Specification

## 1. Overview
Nutrition Scan is a free, ad-free web application that allows users to photograph food labels (nutrition tables and ingredients lists) to extract nutritional information. Users can then create custom meals by specifying the grams of each product and track their daily intake of any nutrient (calories, sodium, saturated fats, sugars, etc.).

## 2. Stack
- **Runtime:** Node 24
- **Frontend:** HTML, CSS, ES Modules (no framework, no build step)
- **Backend:** Node 24 (Express or similar)
- **OCR/AI:** OpenAI-compatible endpoint (configurable by user)

## 3. Data Model

### 3.1 Product
A food product with its nutritional information standardized per 100g.
- `id`: string (unique identifier)
- `name`: string (e.g., "Hazelnut Chocolate Bar")
- `nutrients`: object (nutrient name -> value in grams or kcal per 100g)
  - Example: `{ "energy_kj": 2292, "energy_kcal": 549, "fat": 33, "saturated_fat": 13, "carbohydrates": 55, "sugars": 45, "fiber": 2.4, "protein": 6.8, "sodium": 0.18 }`
- `ingredients`: string (raw ingredients list)

### 3.2 Meal
A collection of products with specified quantities.
- `id`: string (unique identifier)
- `name`: string (e.g., "Lunch Plate")
- `items`: array of `{ productId: string, grams: number }`

### 3.3 DailyLog
A log of meals consumed on a specific date.
- `date`: string (YYYY-MM-DD)
- `meals`: array of `{ mealId: string, timestamp: string }`

## 4. OCR Extraction Interface

### 4.1 Configuration
The user configures their OpenAI-compatible endpoint in the UI:
- `endpoint`: string (URL)
- `apiKey`: string
- `model`: string (e.g., "gpt-4o")

### 4.2 OCR Function
- `extractNutrition(imageBase64: string, config: { endpoint: string, apiKey: string, model: string }): Promise<Product>`
  - Takes a base64-encoded image of a nutrition label.
  - Returns a `Product` object with nutrients per 100g.
  - For testing, this function is mocked to return deterministic results based on the image hash or a predefined set of test images.

## 5. Meal Planning Logic

### 5.1 Calculate Meal Nutrients
- `calculateMealNutrients(meal: Meal, products: Product[]): object`
  - Takes a `Meal` and a map of `Product` by ID.
  - Returns an object with total nutrients for the meal, scaled by grams.
  - Example: If a product has 33g fat per 100g and the meal has 50g of it, the meal contributes 16.5g fat.

### 5.2 Calculate Daily Intake
- `calculateDailyIntake(log: DailyLog, products: Product[]): object`
  - Takes a `DailyLog` and a map of `Product` by ID.
  - Returns an object with total nutrients for the day.

## 6. User Interface

### 6.1 Screens
1. **Home/Scan Screen:**
   - User takes or uploads a photo of a nutrition label.
   - Displays the extracted product information.
   - Option to save the product to their library.
2. **Product Library:**
   - List of saved products.
   - Search/filter products.
3. **Meal Creator:**
   - User selects products from their library.
   - Specifies grams for each product.
   - Displays calculated nutrients for the meal.
   - Option to save the meal.
4. **Daily Log:**
   - Shows meals added to the current day.
   - Displays total daily intake.
   - Option to add more meals.
5. **Settings:**
   - Configure OCR endpoint, API key, and model.

### 6.2 User Actions
- **Take/Upload Photo:** Triggers OCR extraction.
- **Save Product:** Adds the extracted product to the library.
- **Add to Meal:** Selects a product and specifies grams for a meal.
- **Save Meal:** Saves the meal to the library.
- **Log Meal:** Adds a meal to the current day's log.
- **Configure OCR:** Updates the OCR settings.

## 7. Acceptance Criteria

### AC-1: OCR Extraction
- Given a photo of a nutrition label, the app extracts the nutritional information per 100g.
- Example: For the chocolate bar image, the app extracts energy (2292 kJ / 549 kcal), fat (33g), saturated fat (13g), carbohydrates (55g), sugars (45g), fiber (2.4g), protein (6.8g), sodium (0.18g).

### AC-2: Product Saving
- The user can save the extracted product to their library.
- The product is stored with its name, nutrients, and ingredients.

### AC-3: Meal Creation
- The user can create a meal by selecting products and specifying grams.
- The app calculates the total nutrients for the meal based on the grams specified.
- Example: If the user adds 50g of the chocolate bar (33g fat per 100g), the meal contributes 16.5g fat.

### AC-4: Daily Tracking
- The user can log meals to their daily intake.
- The app displays the total daily intake of all nutrients.
- Example: If the user logs two meals, the daily intake is the sum of the nutrients from both meals.

### AC-5: Custom Nutrient Tracking
- The user can track any nutrient they want (e.g., calories, sodium, saturated fats).
- The app displays the total intake for each nutrient.

### AC-6: OCR Configuration
- The user can configure their OCR endpoint, API key, and model.
- The app uses these settings for OCR extraction.

### AC-7: Free and Ad-Free
- The app is free to use and contains no advertisements.

## 8. Examples from Images

### Image 1: Chocolate Bar
- **Product Name:** Hazelnut Chocolate Bar (Dr. Schär AG/SPA)
- **Nutrients per 100g:**
  - Energy: 2292 kJ / 549 kcal
  - Fat: 33g
  - Saturated Fat: 13g
  - Carbohydrates: 55g
  - Sugars: 45g
  - Fiber: 2.4g
  - Protein: 6.8g
  - Sodium: 0.18g

### Image 2: Juice Bottle
- **Product Name:** Versgeperst Appel-Sinaasappel- en Mangosap
- **Nutrients per 100ml:**
  - Energy: 199 kJ / 47 kcal
  - Fat: 0g
  - Carbohydrates: 11g
  - Sugars: 10g
  - Protein: 0.7g
  - Sodium: 0.4g

### Image 3: Olive Oil Spray
- **Product Name:** Extra Olijfolie van de Eerste Persing
- **Nutrients per 100ml:**
  - Energy: 3404 kJ / 828 kcal
  - Fat: 92g
  - Saturated Fat: 14g
  - Carbohydrates: 0g
  - Sugars: 0g
  - Protein: 0g
  - Sodium: 0g