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
    meals: [...(log.meals || []), meal],
  };

  // Aggregate nutrients from the meal
  const nutrients = updatedLog.nutrients || {};
  for (const mealNutrient of meal.nutrients || []) {
    const { nutrient, amount } = mealNutrient;
    if (nutrient && amount !== undefined) {
      nutrients[nutrient] = (nutrients[nutrient] || 0) + amount;
    }
  }
  updatedLog.nutrients = nutrients;

  return updatedLog;
}