/**
 * Tracker module - get daily nutrient totals from a daily log.
 */

/**
 * Returns the total of a specific nutrient from a daily log.
 * @param {Object} log - The daily log object with meals array.
 * @param {string} nutrient - The nutrient key to sum (e.g., 'energy_kj', 'fat', 'sugars').
 * @returns {number} The total amount of the nutrient, or 0 if not found.
 */
export function getDailyNutrientTotal(log, nutrient) {
  if (!log || !Array.isArray(log.meals)) {
    return 0;
  }

  let total = 0;
  for (const meal of log.meals) {
    if (meal && meal.nutrition) {
      total += meal.nutrition[nutrient] || 0;
    }
  }

  return total;
}