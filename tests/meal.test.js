import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createMeal } from "../src/mealModule.js";

describe("mealModule.createMeal", () => {
  test("AC5: creates a meal with products and grams", () => {
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

    const meal = createMeal("Breakfast", [
      { productId: "product-1", grams: 30 },
      { productId: "product-2", grams: 200 },
    ]);

    assert.equal(meal.name, "Breakfast");
    assert.equal(meal.products.length, 2);
    assert.equal(meal.products[0].productId, "product-1");
    assert.equal(meal.products[0].grams, 30);
    assert.equal(meal.products[1].productId, "product-2");
    assert.equal(meal.products[1].grams, 200);
  });

  test("AC6: meal with a single product", () => {
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

    const meal = createMeal("Snack", [
      { productId: "product-1", grams: 30 },
    ]);

    assert.equal(meal.name, "Snack");
    assert.equal(meal.products.length, 1);
    assert.equal(meal.products[0].grams, 30);
  });
});