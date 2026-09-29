import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { extractNutrition } from "../src/ocrModule.js";

describe("ocrModule.extractNutrition", () => {
  test("AC1: extracts nutrition data from a chocolate bar label image", async () => {
    // Simulating the chocolate bar label from the images
    // The OCR module is mocked to return the expected data
    const imageData = new ArrayBuffer(100); // Mocked image data
    
    const result = await extractNutrition(imageData);
    
    assert.equal(result.name, "Schär Melto");
    assert.equal(result.nutritionPer100g.energy, 2292); // kJ
    assert.equal(result.nutritionPer100g.fat, 33); // g
    assert.equal(result.nutritionPer100g.saturatedFat, 13); // g
    assert.equal(result.nutritionPer100g.carbohydrates, 55); // g
    assert.equal(result.nutritionPer100g.sugars, 45); // g
    assert.equal(result.nutritionPer100g.fiber, 2.4); // g
    assert.equal(result.nutritionPer100g.protein, 6.8); // g
    assert.equal(result.nutritionPer100g.salt, 0.18); // g (Salt, not Sodium)
    assert.equal(result.unit, "g");
  });

  test("AC2: extracts nutrition data from a juice bottle label", async () => {
    const imageData = new ArrayBuffer(100); // Mocked image data
    
    const result = await extractNutrition(imageData);
    
    assert.equal(result.name, "Versgeperst Appel-Sinaasappel- en Mangosap");
    assert.equal(result.nutritionPer100g.energy, 199); // kJ
    assert.equal(result.nutritionPer100g.fat, 0); // g
    assert.equal(result.nutritionPer100g.saturatedFat, 0); // g
    assert.equal(result.nutritionPer100g.carbohydrates, 11); // g
    assert.equal(result.nutritionPer100g.sugars, 10); // g
    assert.equal(result.nutritionPer100g.fiber, 0); // g
    assert.equal(result.nutritionPer100g.protein, 0.7); // g
    assert.equal(result.nutritionPer100g.salt, 0); // g
    assert.equal(result.unit, "ml");
  });

  test("AC3: extracts nutrition data from an olive oil spray label", async () => {
    const imageData = new ArrayBuffer(100); // Mocked image data
    
    const result = await extractNutrition(imageData);
    
    assert.equal(result.name, "Extra Olijfolie Spray");
    assert.equal(result.nutritionPer100g.energy, 3404); // kJ
    assert.equal(result.nutritionPer100g.fat, 92); // g
    assert.equal(result.nutritionPer100g.saturatedFat, 14); // g
    assert.equal(result.nutritionPer100g.carbohydrates, 0); // g
    assert.equal(result.nutritionPer100g.sugars, 0); // g
    assert.equal(result.nutritionPer100g.fiber, 0); // g
    assert.equal(result.nutritionPer100g.protein, 0); // g
    assert.equal(result.nutritionPer100g.salt, 0); // g
    assert.equal(result.unit, "g");
  });
});