import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createProduct } from "../src/productModule.js";

describe("productModule.createProduct", () => {
  test("creates a product with name, nutritionPer100g, and unit (AC-2)", () => {
    const product = createProduct("Hazelnut Chocolate Bar", {
      energy_kj: 2292,
      energy_kcal: 549,
      fat: 33,
      saturated_fat: 13,
      carbohydrates: 55,
      sugars: 45,
      fiber: 2.4,
      protein: 6.8,
      sodium: 0.18,
    }, ["Hazelnuts", "Chocolate"], "g");

    assert.strictEqual(product.name, "Hazelnut Chocolate Bar");
    assert.strictEqual(product.nutrients.energy_kj, 2292);
    assert.strictEqual(product.nutrients.fat, 33);
    assert.strictEqual(product.unit, "g");
    assert.ok(product.id);
  });

  test("creates a product with unit ml for liquids (AC-2)", () => {
    const product = createProduct("Apple Juice", {
      energy_kj: 199,
      energy_kcal: 47,
      fat: 0,
      carbohydrates: 11,
      sugars: 10,
      protein: 0.7,
      sodium: 0.4,
    }, undefined, "ml");

    assert.strictEqual(product.unit, "ml");
    assert.strictEqual(product.nutrients.carbohydrates, 11);
  });

  test("creates a product without ingredients (AC-2)", () => {
    const product = createProduct("Simple Product", {
      energy_kj: 100,
      energy_kcal: 24,
      fat: 0,
      carbohydrates: 6,
      sugars: 4,
      protein: 0,
      sodium: 0,
    }, undefined, "g");

    assert.strictEqual(product.ingredients, "");
  });
});