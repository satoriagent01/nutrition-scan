import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getDailyNutrientTotal } from "../src/trackerModule.js";

describe("trackerModule.getDailyNutrientTotal", () => {
  test("AC9: returns total energy from a daily log with one meal", () => {
    const log = {
      date: "2024-01-15",
      meals: [
        {
          name: "Breakfast",
          products: [
            { productId: "product-1", grams: 90 },
          ],
        },
      ],
    };

    const products = {
      "product-1": {
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
      },
    };

    const total = getDailyNutrientTotal(log, "energy", products);
    // 90g of product with 2292 kJ per 100g = 2292 * 0.9 = 2062.8 kJ
    assert.strictEqual(total, 2062.8);
  });

  test("AC10: returns total energy from a daily log with multiple meals", () => {
    const log = {
      date: "2024-01-15",
      meals: [
        {
          name: "Breakfast",
          products: [
            { productId: "product-1", grams: 90 },
          ],
        },
        {
          name: "Snack",
          products: [
            { productId: "product-2", grams: 200 },
          ],
        },
      ],
    };

    const products = {
      "product-1": {
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
      },
      "product-2": {
        id: "product-2",
        name: "Juice",
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
      },
    };

    const total = getDailyNutrientTotal(log, "energy", products);
    // Breakfast: 90g * 2292/100 = 2062.8 kJ
    // Snack: 200ml * 199/100 = 398 kJ
    // Total: 2062.8 + 398 = 2460.8 kJ
    assert.strictEqual(total, 2460.8);
  });

  test("AC11: returns total fat from a daily log", () => {
    const log = {
      date: "2024-01-15",
      meals: [
        {
          name: "Breakfast",
          products: [
            { productId: "product-1", grams: 90 },
          ],
        },
      ],
    };

    const products = {
      "product-1": {
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
      },
    };

    const total = getDailyNutrientTotal(log, "fat", products);
    // 90g * 33/100 = 29.7 g
    assert.strictEqual(total, 29.7);
  });

  test("AC12: returns 0 for a nutrient not present in any product", () => {
    const log = {
      date: "2024-01-15",
      meals: [
        {
          name: "Breakfast",
          products: [
            { productId: "product-1", grams: 90 },
          ],
        },
      ],
    };

    const products = {
      "product-1": {
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
      },
    };

    const total = getDailyNutrientTotal(log, "vitaminC", products);
    assert.strictEqual(total, 0);
  });
});