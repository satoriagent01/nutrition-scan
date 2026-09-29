/**
 * Tracker module - get daily nutrient totals from a daily log.
 */

/**
 * Returns the total of a specific nutrient from a daily log.
 * @param {Object} log - The daily log object with meals array.
 * @param {string} nutrient - The nutrient key to sum (e.g., 'energy', 'fat', 'sugars').
 * @param {Object} products - Map of productId -> product object with nutritionPer100g.
 * @returns {number} The total amount of the nutrient, or 0 if not found.
 */
export function getDailyNutrientTotal(log, nutrient, products) {
  if (!log || !Array.isArray(log.meals)) {
    return 0;
  }

  let total = 0;
  for (const meal of log.meals) {
    if (meal && Array.isArray(meal.products)) {
      for (const item of meal.products) {
        const product = products[item.productId];
        if (product && product.nutritionPer100g) {
          const factor = item.grams / 100;
          total += (product.nutritionPer100g[nutrient] || 0) * factor;
        }
      }
    }
  }

  return total;
}