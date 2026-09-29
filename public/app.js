/**
 * Nutrition Scan - Main Application
 * 
 * A free, ad-free nutrition tracker that uses OCR + AI to extract
 * nutritional information from food label photos.
 */

import { extractNutrition } from "../src/ocrModule.js";
import { createProduct } from "../src/productModule.js";
import { createMeal } from "../src/mealModule.js";
import { addMealToLog } from "../src/logModule.js";
import { getDailyNutrientTotal } from "../src/trackerModule.js";

// ─── State ──────────────────────────────────────────────────────────────────

const state = {
  products: JSON.parse(localStorage.getItem("ns_products") || "[]"),
  dailyLog: JSON.parse(localStorage.getItem("ns_dailyLog") || "null"),
  settings: JSON.parse(localStorage.getItem("ns_settings") || "{}"),
  currentScreen: "scan",
  scannedData: null,
  selectedProducts: [],
  today: new Date().toISOString().split("T")[0],
};

// ─── Persistence ────────────────────────────────────────────────────────────

function saveProducts() {
  localStorage.setItem("ns_products", JSON.stringify(state.products));
}

function saveDailyLog() {
  localStorage.setItem("ns_dailyLog", JSON.stringify(state.dailyLog));
}

function saveSettings() {
  localStorage.setItem("ns_settings", JSON.stringify(state.settings));
}

// ─── Navigation ─────────────────────────────────────────────────────────────

function showScreen(screen) {
  state.currentScreen = screen;
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  const target = document.getElementById(`screen-${screen}`);
  if (target) target.classList.remove("hidden");

  // Update nav active state
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  const navBtn = document.querySelector(`[data-nav="${screen}"]`);
  if (navBtn) navBtn.classList.add("active");

  // Refresh screen-specific content
  if (screen === "products") renderProducts();
  if (screen === "meal") renderMealBuilder();
  if (screen === "log") renderDailyLog();
  if (screen === "settings") renderSettings();
}

// ─── Scan Screen ────────────────────────────────────────────────────────────

function initScanScreen() {
  const fileInput = document.getElementById("file-input");
  const takePhotoBtn = document.getElementById("take-photo-btn");
  const captureBtn = document.getElementById("capture-btn");
  const cancelCaptureBtn = document.getElementById("cancel-capture-btn");
  const confirmBtn = document.getElementById("confirm-scan-btn");
  const discardBtn = document.getElementById("discard-scan-btn");
  const cameraPreview = document.getElementById("camera-preview");

  // File input change
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) processImageFile(file);
  });

  // Camera capture
  if (takePhotoBtn) {
    takePhotoBtn.addEventListener("click", async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        cameraPreview.srcObject = stream;
        cameraPreview.classList.remove("hidden");
        document.getElementById("camera-controls").classList.remove("hidden");
        document.getElementById("file-input").classList.add("hidden");
      } catch (err) {
        alert("Camera access denied. Please use the file upload instead.");
        console.error("Camera error:", err);
      }
    });
  }

  if (captureBtn) {
    captureBtn.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = cameraPreview.videoWidth;
      canvas.height = cameraPreview.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(cameraPreview, 0, 0);
      cameraPreview.srcObject.getTracks().forEach((t) => t.stop());
      cameraPreview.classList.add("hidden");
      document.getElementById("camera-controls").classList.add("hidden");
      document.getElementById("file-input").classList.remove("hidden");

      canvas.toBlob((blob) => {
        if (blob) processImageFile(blob);
      }, "image/jpeg");
    });
  }

  if (cancelCaptureBtn) {
    cancelCaptureBtn.addEventListener("click", () => {
      cameraPreview.srcObject.getTracks().forEach((t) => t.stop());
      cameraPreview.classList.add("hidden");
      document.getElementById("camera-controls").classList.add("hidden");
      document.getElementById("file-input").classList.remove("hidden");
    });
  }

  // Confirm / Discard scanned data
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (!state.scannedData) return;
      const name = document.getElementById("product-name-input").value.trim() || state.scannedData.name;
      const unit = state.scannedData.unit || "g";
      const ingredients = state.scannedData.ingredients || [];

      const product = createProduct(name, state.scannedData.nutritionPer100g, ingredients, unit);
      state.products.push(product);
      saveProducts();
      state.scannedData = null;
      showScreen("products");
    });
  }

  if (discardBtn) {
    discardBtn.addEventListener("click", () => {
      state.scannedData = null;
      document.getElementById("scan-result").classList.add("hidden");
      document.getElementById("scan-actions").classList.add("hidden");
    });
  }
}

async function processImageFile(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const arrayBuffer = e.target.result;
    showLoading(true);

    try {
      const options = {};
      if (state.settings.baseUrl) options.baseUrl = state.settings.baseUrl;
      if (state.settings.apiKey) options.apiKey = state.settings.apiKey;
      if (state.settings.model) options.model = state.settings.model;

      const result = await extractNutrition(arrayBuffer, options);
      state.scannedData = result;
      renderScanResult(result);
    } catch (err) {
      alert("Failed to extract nutrition data: " + err.message);
      console.error("OCR error:", err);
    } finally {
      showLoading(false);
    }
  };
  reader.readAsArrayBuffer(file);
}

function renderScanResult(data) {
  const resultDiv = document.getElementById("scan-result");
  const actionsDiv = document.getElementById("scan-actions");
  const nameInput = document.getElementById("product-name-input");

  nameInput.value = data.name || "";

  let html = `<h3>${data.name || "Unknown Product"}</h3>`;
  html += `<p class="unit-label">Unit: ${data.unit || "g"}</p>`;
  html += `<h4>Nutrition per 100${data.unit || "g"}</h4>`;
  html += `<table class="nutrition-table">`;
  html += `<tr><th>Nutrient</th><th>Amount</th></tr>`;

  const nutrients = data.nutritionPer100g || {};
  const nutrientLabels = {
    energy: "Energy (kJ)",
    energy_kj: "Energy (kJ)",
    energy_kcal: "Energy (kcal)",
    fat: "Fat (g)",
    saturatedFat: "Saturated Fat (g)",
    saturated_fat: "Saturated Fat (g)",
    carbohydrates: "Carbohydrates (g)",
    sugars: "Sugars (g)",
    fiber: "Fiber (g)",
    protein: "Protein (g)",
    salt: "Salt (g)",
    sodium: "Sodium (g)",
  };

  for (const [key, value] of Object.entries(nutrients)) {
    if (value !== undefined && value !== null) {
      const label = nutrientLabels[key] || key;
      html += `<tr><td>${label}</td><td>${value}</td></tr>`;
    }
  }

  html += `</table>`;

  if (data.ingredients && data.ingredients.length > 0) {
    html += `<h4>Ingredients</h4><p>${data.ingredients.join(", ")}</p>`;
  }

  resultDiv.innerHTML = html;
  resultDiv.classList.remove("hidden");
  actionsDiv.classList.remove("hidden");
}

// ─── Products Screen ────────────────────────────────────────────────────────

function renderProducts() {
  const container = document.getElementById("products-list");
  if (!container) return;

  if (state.products.length === 0) {
    container.innerHTML = `<p class="empty-state">No products yet. Scan a food label to get started!</p>`;
    return;
  }

  let html = "";
  state.products.forEach((product, index) => {
    const n = product.nutritionPer100g || {};
    html += `<div class="product-card" data-index="${index}">`;
    html += `<h4>${product.name}</h4>`;
    html += `<p class="product-unit">${product.unit || "g"}</p>`;
    html += `<div class="product-nutrients">`;
    if (n.energy !== undefined) html += `<span>⚡ ${n.energy} kJ</span>`;
    if (n.fat !== undefined) html += `<span>🧈 ${n.fat}g fat</span>`;
    if (n.sugars !== undefined) html += `<span>🍬 ${n.sugars}g sugar</span>`;
    if (n.salt !== undefined) html += `<span>🧂 ${n.salt}g salt</span>`;
    html += `</div>`;
    html += `<button class="btn-small delete-product" data-index="${index}">Delete</button>`;
    html += `</div>`;
  });

  container.innerHTML = html;

  // Delete handlers
  container.querySelectorAll(".delete-product").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.index);
      state.products.splice(idx, 1);
      saveProducts();
      renderProducts();
    });
  });

  // Card click to see details
  container.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-product")) return;
      const idx = parseInt(card.dataset.index);
      showProductDetail(state.products[idx]);
    });
  });
}

function showProductDetail(product) {
  const n = product.nutritionPer100g || {};
  let html = `<h3>${product.name}</h3>`;
  html += `<p>Unit: ${product.unit || "g"}</p>`;
  html += `<h4>Nutrition per 100${product.unit || "g"}</h4>`;
  html += `<table class="nutrition-table">`;
  html += `<tr><th>Nutrient</th><th>Amount</th></tr>`;

  const nutrientLabels = {
    energy: "Energy (kJ)",
    energy_kj: "Energy (kJ)",
    energy_kcal: "Energy (kcal)",
    fat: "Fat (g)",
    saturatedFat: "Saturated Fat (g)",
    saturated_fat: "Saturated Fat (g)",
    carbohydrates: "Carbohydrates (g)",
    sugars: "Sugars (g)",
    fiber: "Fiber (g)",
    protein: "Protein (g)",
    salt: "Salt (g)",
    sodium: "Sodium (g)",
  };

  for (const [key, value] of Object.entries(n)) {
    if (value !== undefined && value !== null) {
      const label = nutrientLabels[key] || key;
      html += `<tr><td>${label}</td><td>${value}</td></tr>`;
    }
  }

  html += `</table>`;

  if (product.ingredients && product.ingredients.length > 0) {
    html += `<h4>Ingredients</h4><p>${product.ingredients.join(", ")}</p>`;
  }

  html += `<button class="btn" onclick="showScreen('meal')">Add to Meal</button>`;
  html += `<button class="btn btn-secondary" onclick="showScreen('products')">Back</button>`;

  const overlay = document.getElementById("product-detail-overlay");
  overlay.innerHTML = html;
  overlay.classList.remove("hidden");
}

// ─── Meal Builder Screen ────────────────────────────────────────────────────

function renderMealBuilder() {
  const container = document.getElementById("meal-products-list");
  const mealNameInput = document.getElementById("meal-name-input");
  const addProductBtn = document.getElementById("add-product-btn");
  const createMealBtn = document.getElementById("create-meal-btn");
  const addToLogBtn = document.getElementById("add-to-log-btn");
  const mealSummary = document.getElementById("meal-summary");

  if (state.products.length === 0) {
    container.innerHTML = `<p class="empty-state">No products yet. Scan a food label first!</p>`;
    return;
  }

  // Render product selector
  let html = "";
  state.products.forEach((product) => {
    html += `<div class="product-selector">`;
    html += `<label>${product.name} (${product.unit || "g"})</label>`;
    html += `<input type="number" class="grams-input" data-product-id="${product.id}" min="0" step="1" placeholder="grams" value="0">`;
    html += `</div>`;
  });
  container.innerHTML = html;

  // Add product to meal (toggle selection)
  container.querySelectorAll(".product-selector").forEach((sel) => {
    const input = sel.querySelector(".grams-input");
    input.addEventListener("input", () => {
      updateMealSummary();
    });
  });

  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      // Already handled by input events above
    });
  }

  if (createMealBtn) {
    createMealBtn.addEventListener("click", () => {
      const mealName = mealNameInput.value.trim() || "Untitled Meal";
      const products = [];

      container.querySelectorAll(".grams-input").forEach((input) => {
        const grams = parseFloat(input.value) || 0;
        if (grams > 0) {
          products.push({
            productId: input.dataset.productId,
            grams: grams,
          });
        }
      });

      if (products.length === 0) {
        alert("Please add at least one product with grams.");
        return;
      }

      const meal = createMeal(mealName, products);
      state.selectedProducts = products;
      state.currentMeal = meal;
      updateMealSummary();
      renderMealSummary();
    });
  }

  if (addToLogBtn) {
    addToLogBtn.addEventListener("click", () => {
      if (!state.currentMeal) {
        alert("Please create a meal first.");
        return;
      }

      // Initialize daily log if needed
      if (!state.dailyLog || state.dailyLog.date !== state.today) {
        state.dailyLog = { date: state.today, meals: [] };
      }

      // Calculate meal nutrition
      const mealNutrition = calculateMealNutrition(state.currentMeal);
      state.currentMeal.nutrition = mealNutrition;

      state.dailyLog = addMealToLog(state.dailyLog, state.currentMeal);
      saveDailyLog();

      alert(`Meal "${state.currentMeal.name}" added to today's log!`);
      showScreen("log");
    });
  }
}

function calculateMealNutrition(meal) {
  const nutrition = {};
  for (const item of meal.products) {
    const product = state.products.find((p) => p.id === item.productId);
    if (!product) continue;

    const n = product.nutritionPer100g || {};
    const factor = item.grams / 100;

    for (const [key, value] of Object.entries(n)) {
      if (value !== undefined && value !== null) {
        nutrition[key] = (nutrition[key] || 0) + value * factor;
      }
    }
  }
  return nutrition;
}

function updateMealSummary() {
  const container = document.getElementById("meal-products-list");
  const summary = document.getElementById("meal-summary");

  let html = "";
  container.querySelectorAll(".grams-input").forEach((input) => {
    const grams = parseFloat(input.value) || 0;
    if (grams > 0) {
      const productId = input.dataset.productId;
      const product = state.products.find((p) => p.id === productId);
      if (product) {
        html += `<div class="meal-item">`;
        html += `<span>${product.name}: ${grams}${product.unit || "g"}</span>`;
        html += `</div>`;
      }
    }
  });

  summary.innerHTML = html;
}

function renderMealSummary() {
  if (!state.currentMeal) return;

  const nutrition = calculateMealNutrition(state.currentMeal);
  const container = document.getElementById("meal-summary");

  let html = `<h4>${state.currentMeal.name}</h4>`;
  html += `<div class="nutrition-table">`;
  html += `<table>`;
  html += `<tr><th>Nutrient</th><th>Amount</th></tr>`;

  const nutrientLabels = {
    energy: "Energy (kJ)",
    energy_kj: "Energy (kJ)",
    energy_kcal: "Energy (kcal)",
    fat: "Fat (g)",
    saturatedFat: "Saturated Fat (g)",
    saturated_fat: "Saturated Fat (g)",
    carbohydrates: "Carbohydrates (g)",
    sugars: "Sugars (g)",
    fiber: "Fiber (g)",
    protein: "Protein (g)",
    salt: "Salt (g)",
    sodium: "Sodium (g)",
  };

  for (const [key, value] of Object.entries(nutrition)) {
    if (value !== undefined && value !== null) {
      const label = nutrientLabels[key] || key;
      html += `<tr><td>${label}</td><td>${Math.round(value * 10) / 10}</td></tr>`;
    }
  }

  html += `</table></div>`;
  container.innerHTML = html;
}

// ─── Daily Log Screen ───────────────────────────────────────────────────────

function renderDailyLog() {
  const container = document.getElementById("daily-log");
  const totalsContainer = document.getElementById("daily-totals");
  const filterSelect = document.getElementById("nutrient-filter");
  const newDayBtn = document.getElementById("new-day-btn");

  // Initialize daily log if needed
  if (!state.dailyLog || state.dailyLog.date !== state.today) {
    state.dailyLog = { date: state.today, meals: [] };
    saveDailyLog();
  }

  // Render meals
  let html = "";
  if (state.dailyLog.meals && state.dailyLog.meals.length > 0) {
    state.dailyLog.meals.forEach((meal) => {
      html += `<div class="log-meal">`;
      html += `<h4>${meal.name}</h4>`;
      if (meal.products) {
        meal.products.forEach((item) => {
          const product = state.products.find((p) => p.id === item.productId);
          if (product) {
            html += `<p class="log-item">${product.name}: ${item.grams}${product.unit || "g"}</p>`;
          }
        });
      }
      html += `</div>`;
    });
  } else {
    html = `<p class="empty-state">No meals logged today. Go to Meal Builder to add some!</p>`;
  }
  container.innerHTML = html;

  // Calculate and display totals
  renderTotals(filterSelect);

  // Filter change
  if (filterSelect) {
    filterSelect.addEventListener("change", () => renderTotals(filterSelect));
  }

  // New day button
  if (newDayBtn) {
    newDayBtn.addEventListener("click", () => {
      state.dailyLog = { date: state.today, meals: [] };
      saveDailyLog();
      renderDailyLog();
    });
  }
}

function renderTotals(filterSelect) {
  const totalsContainer = document.getElementById("daily-totals");
  if (!state.dailyLog || !state.dailyLog.meals || state.dailyLog.meals.length === 0) {
    totalsContainer.innerHTML = "";
    return;
  }

  // Build products lookup
  const productsMap = {};
  state.products.forEach((p) => {
    productsMap[p.id] = p;
  });

  // Calculate totals for all nutrients
  const allNutrients = {};
  for (const meal of state.dailyLog.meals) {
    if (!meal.products) continue;
    for (const item of meal.products) {
      const product = productsMap[item.productId];
      if (!product) continue;
      const n = product.nutritionPer100g || {};
      const factor = item.grams / 100;
      for (const [key, value] of Object.entries(n)) {
        if (value !== undefined && value !== null) {
          allNutrients[key] = (allNutrients[key] || 0) + value * factor;
        }
      }
    }
  }

  const nutrientLabels = {
    energy: "Energy (kJ)",
    energy_kj: "Energy (kJ)",
    energy_kcal: "Energy (kcal)",
    fat: "Fat (g)",
    saturatedFat: "Saturated Fat (g)",
    saturated_fat: "Saturated Fat (g)",
    carbohydrates: "Carbohydrates (g)",
    sugars: "Sugars (g)",
    fiber: "Fiber (g)",
    protein: "Protein (g)",
    salt: "Salt (g)",
    sodium: "Sodium (g)",
  };

  // Build filter options
  if (filterSelect) {
    filterSelect.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All Nutrients";
    filterSelect.appendChild(allOption);

    for (const key of Object.keys(allNutrients)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = nutrientLabels[key] || key;
      filterSelect.appendChild(opt);
    }
  }

  const filter = filterSelect ? filterSelect.value : "all";

  let html = `<h3>Daily Totals</h3>`;
  html += `<table class="nutrition-table">`;
  html += `<tr><th>Nutrient</th><th>Total</th></tr>`;

  for (const [key, value] of Object.entries(allNutrients)) {
    if (filter !== "all" && filter !== key) continue;
    const label = nutrientLabels[key] || key;
    html += `<tr><td>${label}</td><td>${Math.round(value * 10) / 10}</td></tr>`;
  }

  html += `</table>`;
  totalsContainer.innerHTML = html;
}

// ─── Settings Screen ────────────────────────────────────────────────────────

function renderSettings() {
  const baseUrlInput = document.getElementById("settings-base-url");
  const apiKeyInput = document.getElementById("settings-api-key");
  const modelInput = document.getElementById("settings-model");
  const saveBtn = document.getElementById("save-settings-btn");
  const clearBtn = document.getElementById("clear-data-btn");

  if (baseUrlInput) baseUrlInput.value = state.settings.baseUrl || "";
  if (apiKeyInput) apiKeyInput.value = state.settings.apiKey || "";
  if (modelInput) modelInput.value = state.settings.model || "gpt-4-vision-preview";

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      state.settings.baseUrl = baseUrlInput.value.trim();
      state.settings.apiKey = apiKeyInput.value.trim();
      state.settings.model = modelInput.value.trim() || "gpt-4-vision-preview";
      saveSettings();
      alert("Settings saved!");
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
        state.products = [];
        state.dailyLog = null;
        state.selectedProducts = [];
        state.currentMeal = null;
        saveProducts();
        saveDailyLog();
        alert("All data cleared.");
        showScreen("scan");
      }
    });
  }
}

// ─── Utility ────────────────────────────────────────────────────────────────

function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    if (show) {
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
    }
  }
}

// ─── Init ───────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Navigation
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      showScreen(btn.dataset.nav);
    });
  });

  // Close product detail overlay
  const overlay = document.getElementById("product-detail-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.add("hidden");
      }
    });
  }

  initScanScreen();
  showScreen("scan");
});