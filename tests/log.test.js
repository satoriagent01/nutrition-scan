import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { addMealToLog } from "../src/logModule.js";

describe("logModule.addMealToLog", () => {
  test("AC7: adds a meal to a daily log, aggregating nutrients", () => {
    const product1 = {
      id: "product-1",
      name: "Schär Melto",
      nutritionPer100g: {
        energy: 2292,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
      },
      unit: "g",
    };

    const product2 = {
      id: "product-2",
      name: "Versgeperst Appel-Sinaasappel- en Mangosap",
      nutritionPer100g: {
        energy: 199,
        fat: 0,
        saturatedFat: 0,
        carbohydrates: 11,
        sugars: 10,
        fiber: 0,
        protein: 0.7,
        salt: 0,
      },
      unit: "ml",
    };

    const meal = {
      id: "meal-1",
      name: "My Snack",
      products: [
        { productId: "product-1", grams: 30 },
        { productId: "product-2", grams: 200 },
      ],
    };

    const log = {
      id: "log-1",
      date: "2024-01-15",
      meals: [],
    };

    const updatedLog = addMealToLog(log, meal);

    assert.strictEqual(updatedLog.meals.length, 1);
    assert.strictEqual(updatedLog.meals[0].mealId, "meal-1");
    assert.strictEqual(updatedLog.meals[0].mealName, "My Snack");
    assert.strictEqual(updatedLog.meals[0].nutrients.energy, 2292 * 0.3 + 199 * 2);
    assert.strictEqual(updatedLog.meals[0].nutrients.fat, 33 * 0.3 + 0 * 2);
    assert.strictEqual(updatedLog.meals[0].nutrients.saturatedFat, 13 * 0.3 + 0 * 2);
    assert.strictEqual(updatedLog.meals[0].nutrients.carbohydrates, 55 * 0.3 + 11 * 2);
    assert.strictEqual(updatedLog.meals[0].nutrients.sugars, 45 * 0.3 + 10 * 2);
    assert.strictEqual(updatedLog.meals[0].nutrients.fiber, 2.4 * 0.3 + 0 * 2);
    assert.strictEqual(updatedLog.meals[0].nutrients.protein, 6.8 * 0.3 + 0.7 * 2);
    assert.strictEqual(updatedLog.meals[0].nutrients.salt, 0.18 * 0.3 + 0 * 2);
  });

  test("AC8: adds multiple meals to a daily log", () => {
    const product1 = {
      id: "product-1",
      name: "Schär Melto",
      nutritionPer100g: {
        energy: 2292,
        fat: 33,
        saturatedFat: 13,
        carbohydrates: 55,
        sugars: 45,
        fiber: 2.4,
        protein: 6.8,
        salt: 0.18,
      },
      unit: "g",
    };

    const product2 = {
      id: "product-2",
      name: "Versgeperst Appel-Sinaasappel- en Mangosap",
      nutritionPer100g: {
        energy: 199,
        fat: 0,
        saturatedFat: 0,
        carbohydrates: 11,
        sugars: 10,
        fiber: 0,
        protein: 0.7,
        salt: 0,
      },
      unit: "ml",
    };

    const meal1 = {
      id: "meal-1",
      name: "Breakfast",
      products: [
        { productId: "product-1", grams: 30 },
      ],
    };

    const meal2 = {
      id: "meal-2",
      name: "Lunch",
      products: [
        { productId: "product-2", grams: 200 },
      ],
    };

    const log = {
      id: "log-1",
      date: "2024-01-15",
      meals: [],
    };

    const logAfterFirst = addMealToLog(log, meal1);
    const logAfterSecond = addMealToLog(logAfterFirst, meal2);

    assert.strictEqual(logAfterSecond.meals.length, 2);
    assert.strictEqual(logAfterSecond.meals[0].mealId, "meal-1");
    assert.strictEqual(logAfterSecond.meals[1].mealId, "meal-2");
  });
});