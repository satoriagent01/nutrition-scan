/**
 * Log module - adds meals to daily log and aggregates nutrients
 */

/**
 * Adds a meal to a daily log, aggregating nutrients.
 * @param {Object} log - The daily log object
 * @param {Object} meal - The meal object to add
 * @returns {Object} The updated log
 */
export function addMealToLog(log, meal) {
  const updatedLog = {
    ...log,
    meals: [...(log.meals || [])],
  };

  // Calculate nutrients for this meal from its products
  const nutrients = {};
  for (const item of meal.products) {
    const { productId, grams } = item;
    // Each product in the meal has nutritionPer100g
    const productNutrition = productId.nutritionPer100g || productId;
    const factor = grams / 100;
    for (const key of Object.keys(productNutrition)) {
      nutrients[key] = (nutrients[key] || 0) + productNutrition[key] * factor;
    }
  }

  updatedLog.meals.push({
    mealId: meal.id,
    mealName: meal.name,
    nutrients,
  });

  return updatedLog;
}