/**
 * Product module - creates product records with nutritional information.
 */

/**
 * Creates a product record with name, nutrition per 100g/ml, ingredients, and unit.
 * @param {string} name - Product name
 * @param {Object} nutritionPer100g - Nutritional data per 100g or 100ml
 * @param {string[]} [ingredients] - List of ingredients
 * @param {string} [unit="g"] - Unit of measurement ("g" or "ml")
 * @returns {Object} Product object
 */
export function createProduct(name, nutritionPer100g, ingredients, unit = "g") {
  return {
    id: crypto.randomUUID(),
    name,
    nutrients: { ...nutritionPer100g },
    ingredients: ingredients ?? "",
    unit,
  };
}