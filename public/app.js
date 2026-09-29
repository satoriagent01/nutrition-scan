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
  currentMeal: null,
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

  // Hide all screens
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.add("hidden");
  });

  // Show target screen
  const target = document.getElementById(`screen-${screen}`);
  if (target) target.classList.remove("hidden");

  // Update nav active state
  document.querySelectorAll(".nav-btn").forEach((n) => n.classList.remove("active"));
  const navBtn = document.querySelector(`.nav-btn[data-screen="${screen}"]`);
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
  const cameraBtn = document.getElementById("btn-camera");
  const uploadBtn = document.getElementById("btn-upload");
  const previewContainer = document.getElementById("preview-container");
  const previewImage = document.getElementById("preview-image");
  const extractBtn = document.getElementById("btn-extract");
  const cancelPreviewBtn = document.getElementById("btn-cancel-preview");
  const saveProductBtn = document.getElementById("btn-save-product");
  const discardBtn = document.getElementById("btn-discard");

  // File input change (from upload or camera capture)
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) processImageFile(file);
  });

  // Upload button
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      fileInput.click();
    });
  }

  // Camera button - open camera and capture
  if (cameraBtn) {
    cameraBtn.addEventListener("click", async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        // Create a temporary video element for preview
        const video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.style.width = "100%";
        video.style.maxHeight = "300px";
        video.style.borderRadius = "8px";
        video.style.marginBottom = "10px";

        // Replace the preview image with video for camera view
        const previewImg = document.getElementById("preview-image");
        previewImg.style.display = "none";
        previewContainer.insertBefore(video, previewImg);

        // Show preview container
        previewContainer.classList.remove("hidden");

        // Replace extract/cancel buttons with capture/cancel
        const existingButtons = previewContainer.querySelectorAll(".btn");
        existingButtons.forEach((btn) => btn.style.display = "none");

        const captureBtn = document.createElement("button");
        captureBtn.id = "btn-capture";
        captureBtn.className = "btn primary";
        captureBtn.textContent = "📸 Capture Photo";
        captureBtn.addEventListener("click", () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0);

          // Stop camera stream
          stream.getTracks().forEach((t) => t.stop());

          // Remove video element
          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }

          // Show captured image
          previewImg.style.display = "block";
          previewImg.src = canvas.toDataURL("image/jpeg");

          // Show original buttons
          existingButtons.forEach((btn) => btn.style.display = "");

          // Convert canvas to blob and process
          canvas.toBlob((blob) => {
            if (blob) processImageFile(blob);
          }, "image/jpeg");
        });

        const cancelCameraBtn = document.createElement("button");
        cancelCameraBtn.id = "btn-cancel-camera";
        cancelCameraBtn.className = "btn";
        cancelCameraBtn.textContent = "✕ Cancel";
        cancelCameraBtn.addEventListener("click", () => {
          stream.getTracks().forEach((t) => t.stop());
          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }
          previewImg.style.display = "block";
          previewContainer.classList.add("hidden");
          existingButtons.forEach((btn) => btn.style.display = "");
        });

        previewContainer.insertBefore(captureBtn, previewImg);
        previewContainer.insertBefore(cancelCameraBtn, captureBtn);

      } catch (err) {
        alert("Camera access denied. Please use the file upload instead.");
        console.error("Camera error:", err);
      }
    });
  }

  // Cancel preview
  if (cancelPreviewBtn) {
    cancelPreviewBtn.addEventListener("click", () => {
      document.getElementById("preview-container").classList.add("hidden");
      fileInput.value = "";
    });
  }

  // Extract nutrition
  if (extractBtn) {
    extractBtn.addEventListener("click", async () => {
      const previewImg = document.getElementById("preview-image");
      if (!previewImg || !previewImg.src || previewImg.src === "") {
        alert("Please take or upload a photo first.");
        return;
      }

      // Convert data URL to ArrayBuffer
      const response = await fetch(previewImg.src);
      const arrayBuffer = await response.arrayBuffer();

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
    });
  }

  // Save product
  if (saveProductBtn) {
    saveProductBtn.addEventListener("click", () => {
      if (!state.scannedData) return;
      const nameInput = document.getElementById("product-name-input");
      const name = nameInput.value.trim() || state.scannedData.name || "Unknown Product";
      const unit = state.scannedData.unit || "g";
      const ingredients = state.scannedData.ingredients || [];

      const product = createProduct(name, state.scannedData.nutritionPer100g, ingredients, unit);
      state.products.push(product);
      saveProducts();
      state.scannedData = null;
      document.getElementById("extraction-result").classList.add("hidden");
      document.getElementById("preview-container").classList.add("hidden");
      showScreen("products");
    });
  }

  // Discard scanned data
  if (discardBtn) {
    discardBtn.addEventListener("click", () => {
      state.scannedData = null;
      document.getElementById("extraction-result").classList.add("hidden");
      document.getElementById("preview-container").classList.add("hidden");
      document.getElementById("product-name-input").value = "";
    });
  }
}

async function processImageFile(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const arrayBuffer = e.target.result;

    // Show preview
    const previewImg = document.getElementById("preview-image");
    const previewContainer = document.getElementById("preview-container");
    const dataUrl = URL.createObjectURL(file);
    previewImg.src = dataUrl;
    previewContainer.classList.remove("hidden");

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
  const resultDiv = document.getElementById("extraction-result");
  const detailsDiv = document.getElementById("extraction-details");
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

  detailsDiv.innerHTML = html;
  resultDiv.classList.remove("hidden");
}

// ─── Products Screen ────────────────────────────────────────────────────────

function renderProducts() {
  const container = document.getElementById("products-list");
  const noProducts = document.getElementById("no-products");
  if (!container) return;

  if (state.products.length === 0) {
    container.innerHTML = "";
    if (noProducts) noProducts.classList.remove("hidden");
    return;
  }

  if (noProducts) noProducts.classList.add("hidden");

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
      e.stopPropagation();
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

  html += `<button class="btn" id="btn-add-meal-from-detail">Add to Meal</button>`;
  html += `<button class="btn btn-secondary" id="btn-back-from-detail">Back</button>`;

  const modalName = document.getElementById("modal-product-name");
  const modalDetails = document.getElementById("modal-product-details");
  if (modalName) modalName.textContent = product.name;
  if (modalDetails) modalDetails.innerHTML = html;

  const modal = document.getElementById("product-modal");
  if (modal) {
    modal.classList.remove("hidden");

    // Add to meal button
    const addMealBtn = document.getElementById("btn-add-meal-from-detail");
    if (addMealBtn) {
      addMealBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
        showScreen("meal");
      });
    }

    // Back button
    const backBtn = document.getElementById("btn-back-from-detail");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }
  }
}

// Close modal
function initModal() {
  const modal = document.getElementById("product-modal");
  const closeBtn = document.getElementById("btn-close-modal");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }
}

// ─── Meal Builder Screen ────────────────────────────────────────────────────

function renderMealBuilder() {
  const container = document.getElementById("meal-products-list");
  const mealNameInput = document.getElementById("meal-name-input");
  const productSelect = document.getElementById("product-select");
  const gramsInput = document.getElementById("grams-input");
  const addProductBtn = document.getElementById("btn-add-product");
  const saveMealBtn = document.getElementById("btn-save-meal");
  const addToLogBtn = document.getElementById("btn-add-meal-to-log");
  const nutritionSummary = document.getElementById("meal-nutrition-summary");
  const nutritionDetails = document.getElementById("meal-nutrition-details");

  // Populate product selector
  if (productSelect) {
    productSelect.innerHTML = '<option value="">Select a product...</option>';
    state.products.forEach((product) => {
      const opt = document.createElement("option");
      opt.value = product.id;
      opt.textContent = `${product.name} (${product.unit || "g"})`;
      productSelect.appendChild(opt);
    });
  }

  // Clear current meal products list
  if (container) {
    container.innerHTML = "";
  }

  state.selectedProducts = state.selectedProducts || [];
  state.currentMeal = state.currentMeal || null;

  // Render selected products
  renderSelectedProducts();

  // Add product to meal
  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      const productId = productSelect.value;
      const grams = parseFloat(gramsInput.value) || 0;

      if (!productId) {
        alert("Please select a product.");
        return;
      }

      if (grams <= 0) {
        alert("Please enter grams.");
        return;
      }

      // Check if already added
      const existing = state.selectedProducts.find((p) => p.productId === productId);
      if (existing) {
        existing.grams = grams;
      } else {
        state.selectedProducts.push({ productId, grams });
      }

      renderSelectedProducts();
      updateMealNutrition();

      // Reset inputs
      productSelect.value = "";
      if (gramsInput) gramsInput.value = "";
    });
  }

  // Save meal
  if (saveMealBtn) {
    saveMealBtn.addEventListener("click", () => {
      const mealName = mealNameInput.value.trim() || "Untitled Meal";

      if (state.selectedProducts.length === 0) {
        alert("Please add at least one product to the meal.");
        return;
      }

      const meal = createMeal(mealName, state.selectedProducts);
      state.currentMeal = meal;

      // Calculate nutrition
      const mealNutrition = calculateMealNutrition(meal);
      state.currentMeal.nutrition = mealNutrition;

      updateMealNutrition();
      alert(`Meal "${meal.name}" saved!`);
    });
  }

  // Add meal to log
  if (addToLogBtn) {
    addToLogBtn.addEventListener("click", () => {
      if (!state.currentMeal) {
        alert("Please save a meal first.");
        return;
      }

      // Initialize daily log if needed
      if (!state.dailyLog || state.dailyLog.date !== state.today) {
        state.dailyLog = { date: state.today, meals: [] };
      }

      state.dailyLog = addMealToLog(state.dailyLog, state.currentMeal);
      saveDailyLog();

      alert(`Meal "${state.currentMeal.name}" added to today's log!`);
      showScreen("log");
    });
  }
}

function renderSelectedProducts() {
  const container = document.getElementById("meal-products-list");
  if (!container) return;

  if (state.selectedProducts.length === 0) {
    container.innerHTML = `<p class="empty-state">No products added yet. Select a product above to add it.</p>`;
    return;
  }

  let html = "";
  state.selectedProducts.forEach((item, index) => {
    const product = state.products.find((p) => p.id === item.productId);
    if (product) {
      html += `<div class="meal-item">`;
      html += `<span>${product.name}: ${item.grams}${product.unit || "g"}</span>`;
      html += `<button class="btn-small remove-meal-item" data-index="${index}">✕</button>`;
      html += `</div>`;
    }
  });

  container.innerHTML = html;

  // Remove handlers
  container.querySelectorAll(".remove-meal-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(e.target.dataset.index);
      state.selectedProducts.splice(idx, 1);
      renderSelectedProducts();
      updateMealNutrition();
    });
  });
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

function updateMealNutrition() {
  const summaryDiv = document.getElementById("meal-nutrition-summary");
  const detailsDiv = document.getElementById("meal-nutrition-details");

  if (!summaryDiv || !detailsDiv) return;

  if (state.selectedProducts.length === 0) {
    summaryDiv.classList.add("hidden");
    return;
  }

  const nutrition = calculateMealNutrition({ products: state.selectedProducts });

  let html = `<h4>Meal Nutrition</h4>`;
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

  for (const [key, value] of Object.entries(nutrition)) {
    if (value !== undefined && value !== null) {
      const label = nutrientLabels[key] || key;
      html += `<tr><td>${label}</td><td>${Math.round(value * 10) / 10}</td></tr>`;
    }
  }

  html += `</table>`;
  detailsDiv.innerHTML = html;
  summaryDiv.classList.remove("hidden");
}

// ─── Daily Log Screen ───────────────────────────────────────────────────────

function renderDailyLog() {
  const mealsContainer = document.getElementById("meals-in-log");
  const totalsContainer = document.getElementById("nutrient-totals");
  const filterSelect = document.getElementById("nutrient-select");
  const noMeals = document.getElementById("no-meals");
  const dateDisplay = document.getElementById("date-display");

  // Initialize daily log if needed
  if (!state.dailyLog || state.dailyLog.date !== state.today) {
    state.dailyLog = { date: state.today, meals: [] };
    saveDailyLog();
  }

  // Display date
  if (dateDisplay) {
    dateDisplay.textContent = `Date: ${state.today}`;
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
  mealsContainer.innerHTML = html;

  if (noMeals) {
    if (state.dailyLog.meals && state.dailyLog.meals.length > 0) {
      noMeals.classList.add("hidden");
    } else {
      noMeals.classList.remove("hidden");
    }
  }

  // Calculate and display totals
  renderTotals(filterSelect);
}

function renderTotals(filterSelect) {
  const totalsContainer = document.getElementById("nutrient-totals");
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

  const filter = filterSelect ? filterSelect.value : "energy_kcal";

  let html = `<h3>Daily Totals</h3>`;
  html += `<table class="nutrition-table">`;
  html += `<tr><th>Nutrient</th><th>Total</th></tr>`;

  if (filter === "all") {
    for (const [key, value] of Object.entries(allNutrients)) {
      const label = nutrientLabels[key] || key;
      html += `<tr><td>${label}</td><td>${Math.round(value * 10) / 10}</td></tr>`;
    }
  } else {
    const value = allNutrients[filter];
    if (value !== undefined) {
      const label = nutrientLabels[filter] || filter;
      html += `<tr><td>${label}</td><td>${Math.round(value * 10) / 10}</td></tr>`;
    }
  }

  html += `</table>`;
  totalsContainer.innerHTML = html;
}

// ─── Settings Screen ────────────────────────────────────────────────────────

function renderSettings() {
  const urlInput = document.getElementById("api-url");
  const keyInput = document.getElementById("api-key");
  const modelInput = document.getElementById("model-select");
  const saveBtn = document.getElementById("btn-save-settings");
  const resetBtn = document.getElementById("btn-reset-settings");

  if (urlInput) urlInput.value = state.settings.baseUrl || "";
  if (keyInput) keyInput.value = state.settings.apiKey || "";
  if (modelInput) modelInput.value = state.settings.model || "gpt-4o";

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      state.settings.baseUrl = urlInput.value.trim();
      state.settings.apiKey = keyInput.value.trim();
      state.settings.model = modelInput.value.trim() || "gpt-4o";
      saveSettings();
      alert("Settings saved!");
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      state.settings = {};
      saveSettings();
      urlInput.value = "";
      keyInput.value = "";
      modelInput.value = "gpt-4o";
      alert("Settings reset to defaults.");
    });
  }
}

// ─── Utility ────────────────────────────────────────────────────────────────

function showLoading(show) {
  // Simple loading indicator using alert or a temporary overlay
  if (show) {
    // Create a temporary loading overlay
    let overlay = document.getElementById("loading-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "loading-overlay";
      overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;";
      overlay.innerHTML = '<div style="background:white;padding:20px;border-radius:8px;text-align:center;"><p>Loading...</p></div>';
      document.body.appendChild(overlay);
    }
    overlay.classList.remove("hidden");
  } else {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }
}

// ─── Init ───────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const screen = btn.dataset.screen;
      if (screen) showScreen(screen);
    });
  });

  initModal();
  initScanScreen();
  showScreen("scan");
});