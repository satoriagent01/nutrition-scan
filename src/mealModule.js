/**
 * Meal module - creates meals with products and grams
 */

/**
 * Creates a meal with products and their gram amounts.
 * @param {string} name - The name of the meal
 * @param {Array<{productId: string, grams: number}>} products - Array of products with grams
 * @returns {{name: string, products: Array<{productId: string, grams: number}>, id: string}}
 */
export function createMeal(name, products) {
  return {
    name,
    products,
    id: crypto.randomUUID(),
  };
}