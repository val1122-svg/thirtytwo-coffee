// ThirtyTwo Coffee Order App (frontend)

// ---------- MENU DATA ----------
const menuItems = [
  { id: "espresso", name: "Espresso", hotPrice: 8, icedPrice: 9, hasHot: true, hasIced: true },
  { id: "americano", name: "Americano", hotPrice: 9, icedPrice: 10, hasHot: true, hasIced: true },
  { id: "longblack", name: "Long Black", hotPrice: 9, icedPrice: 10, hasHot: true, hasIced: true },
  { id: "flatwhite", name: "Flat White", hotPrice: 11, icedPrice: null, hasHot: true, hasIced: false },
  { id: "cafelatte", name: "Cafe Latte", hotPrice: 11, icedPrice: 12, hasHot: true, hasIced: true },
  { id: "capuccino", name: "Cappuccino", hotPrice: 11, icedPrice: 12, hasHot: true, hasIced: true },
  { id: "piccolo", name: "Piccolo", hotPrice: 11, icedPrice: 12, hasHot: true, hasIced: true },
  { id: "dirtylatte", name: "Dirty Latte", hotPrice: null, icedPrice: 13, hasHot: false, hasIced: true },
  { id: "mocha", name: "Chocolate Mocha", hotPrice: 12, icedPrice: 13, hasHot: true, hasIced: true },
  { id: "matcha", name: "Matcha", hotPrice: 13, icedPrice: 14, hasHot: true, hasIced: true },
  { id: "hojicha", name: "Hojicha", hotPrice: 13, icedPrice: 14, hasHot: true, hasIced: true },
  { id: "chocolate", name: "Chocolate", hotPrice: 11, icedPrice: 12, hasHot: true, hasIced: true },
  { id: "x2choco", name: "X2 Chocolate", hotPrice: null, icedPrice: 13, hasHot: false, hasIced: true },
  { id: "honeylemon", name: "Honey Lemon Spark", hotPrice: null, icedPrice: 7, hasHot: false, hasIced: true },
  { id: "jaslemon", name: "JasLemon Spark", hotPrice: null, icedPrice: 8, hasHot: false, hasIced: true }
];

// addons list (removed "Pour Own Art")
const addonsList = [
  { id: "extra_shot", name: "Extra Shot", price: 4 },
  { id: "oat_milk", name: "Oat Milk", price: 2 }
];

// ---------- STATE ----------
// Each drink can be ordered as BOTH hot and iced (if available).
// Example structure:
// {
//   itemId, name, hasHot, hasIced, hotPrice, icedPrice,
//   hot: { quantity, addons: [] } (if hasHot)
//   iced:{ quantity, addons: [] } (if hasIced)
// }
let drinkSelections = [];

function initSelections() {
  drinkSelections = menuItems.map((item) => {
    const sel = {
      itemId: item.id,
      name: item.name,
      hasHot: item.hasHot,
      hasIced: item.hasIced,
      hotPrice: item.hotPrice,
      icedPrice: item.icedPrice
    };
    if (item.hasHot) sel.hot = { quantity: 0, addons: [] };
    if (item.hasIced) sel.iced = { quantity: 0, addons: [] };
    return sel;
  });
}

function getAddonTotal(addonIds) {
  return (addonIds || []).reduce((sum, aid) => {
    const add = addonsList.find((a) => a.id === aid);
    return sum + (add ? add.price : 0);
  }, 0);
}

function getVariantBasePrice(sel, temp) {
  const p = temp === "hot" ? sel.hotPrice : sel.icedPrice;
  return p != null ? p : 0;
}

function getVariantLineTotal(sel, temp) {
  const v = sel[temp];
  if (!v) return 0;
  const unit = getVariantBasePrice(sel, temp) + getAddonTotal(v.addons);
  return unit * (v.quantity || 0);
}

function getTotalPrice() {
  return drinkSelections.reduce((sum, sel) => {
    return sum + getVariantLineTotal(sel, "hot") + getVariantLineTotal(sel, "iced");
  }, 0);
}

function getSelectedLineItems() {
  /** @type {Array<{id:string,name:string,temp:"hot"|"iced",qty:number,addons:string[],lineTotal:number}>} */
  const out = [];

  drinkSelections.forEach((sel) => {
    ["hot", "iced"].forEach((temp) => {
      const v = sel[temp];
      if (!v || !v.quantity) return;
      out.push({
        id: sel.itemId,
        name: sel.name,
        temp,
        qty: v.quantity,
        addons: [...(v.addons || [])],
        lineTotal: getVariantLineTotal(sel, temp)
      });
    });
  });

  return out;
}

// ---------- DOM HELPERS ----------
function $(id) {
  return document.getElementById(id);
}

function setError(id, msg) {
  const el = $(id);
  if (el) el.textContent = msg || "";
}

function clearErrors() {
  ["nameError", "phoneError", "pickupDateError", "pickupTimeError", "paymentError"].forEach((id) =>
    setError(id, "")
  );
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ---------- PAGE 2: DRINKS RENDERING ----------
function renderDrinksPage() {
  const container = $("drinksContainer");
  if (!container) return;

  container.innerHTML = drinkSelections
    .map((sel, idx) => {
      const hotLabel = sel.hotPrice != null ? `Hot RM${sel.hotPrice}` : "";
      const icedLabel = sel.icedPrice != null ? `Iced RM${sel.icedPrice}` : "";
      const priceLabel = [hotLabel, icedLabel].filter(Boolean).join(" / ");

      const variantBlock = (temp) => {
        const v = sel[temp];
        if (!v) return "";
        const tempLabel = temp === "hot" ? "Hot" : "Iced";
        const addonsHtml = addonsList
          .map((addon) => {
            const checked = v.addons.includes(addon.id) ? "checked" : "";
            return `
              <label class="addon-label">
                <input type="checkbox" class="addon-chk" data-idx="${idx}" data-temp="${temp}" data-addon="${addon.id}" ${checked}>
                <span class="addon-name">${addon.name}</span>
                <span class="addon-price">+RM${addon.price}</span>
              </label>
            `;
          })
          .join("");

        const lineTotal = getVariantLineTotal(sel, temp);

        return `
          <div class="options-row">
            <div class="temp-select">
              <span>Temp:</span>
              <strong>${tempLabel}</strong>
            </div>
            <div class="qty-select">
              <span>Qty:</span>
              <input type="number" min="0" max="20" class="qty-input" data-idx="${idx}" data-temp="${temp}" value="${v.quantity}" step="1" inputmode="numeric">
            </div>
          </div>
          <div class="addons">
            ${addonsHtml}
          </div>
          <div class="drink-total">Line total (${tempLabel}): RM ${lineTotal.toFixed(2)}</div>
        `;
      };

      const cardTotal = getVariantLineTotal(sel, "hot") + getVariantLineTotal(sel, "iced");

      return `
        <div class="drink-item">
          <div class="drink-header">
            <span class="drink-name">${sel.name}</span>
            <span class="price-range">${priceLabel}</span>
          </div>
          ${variantBlock("hot")}
          ${variantBlock("iced")}
          <div class="drink-total"><strong>Drink total:</strong> RM ${cardTotal.toFixed(2)}</div>
        </div>
      `;
    })
    .join("");

  updateSummaryPreview();
}

function updateSummaryPreview() {
  const total = getTotalPrice();
  const summaryDiv = $("orderSummaryPreview");
  if (summaryDiv) summaryDiv.textContent = `💰 Total: RM ${total.toFixed(2)}`;
}

function attachDrinkEvents() {
  const container = $("drinksContainer");
  if (!container) return;

  container.addEventListener("change", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    // qty
    if (target.classList.contains("qty-input")) {
      const idx = Number(target.dataset.idx);
      const temp = target.dataset.temp;
      const val = Math.max(0, Math.min(20, Number.parseInt(target.value || "0", 10) || 0));
      if (!Number.isFinite(idx) || (temp !== "hot" && temp !== "iced")) return;
      if (!drinkSelections[idx][temp]) return;
      drinkSelections[idx][temp].quantity = val;
      renderDrinksPage();
      return;
    }

    // addons
    if (target.classList.contains("addon-chk")) {
      const idx = Number(target.dataset.idx);
      const temp = target.dataset.temp;
      const addonId = target.dataset.addon;
      if (!Number.isFinite(idx) || (temp !== "hot" && temp !== "iced") || !addonId) return;
      const v = drinkSelections[idx][temp];
      if (!v) return;

      const isChecked = /** @type {HTMLInputElement} */ (target).checked;
      if (isChecked) {
        if (!v.addons.includes(addonId)) v.addons.push(addonId);
      } else {
        v.addons = v.addons.filter((a) => a !== addonId);
      }
      renderDrinksPage();
    }
  });
}

// ---------- PAGE 3: PICKUP HELPERS ----------
function initPickupTimes() {
  const timeSelect = $("pickupTime");
  if (!timeSelect) return;
  if (timeSelect.dataset.initialized === "1") return;

  timeSelect.innerHTML = "";
  for (let hour = 6; hour <= 9; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour === 9 && min > 0) break;
      const hourFmt = hour.toString().padStart(2, "0");
      const minFmt = min.toString().padStart(2, "0");
      const val = `${hourFmt}:${minFmt}`;
      const option = document.createElement("option");
      option.value = val;
      option.textContent = `${hour}:${minFmt} AM`;
      timeSelect.appendChild(option);
    }
  }
  if (timeSelect.options.length) timeSelect.value = "08:00";
  timeSelect.dataset.initialized = "1";
}

function setDateMinAndValidation() {
  const dateInput = $("pickupDate");
  if (!dateInput) return;
  if (dateInput.dataset.initialized === "1") return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.min = `${yyyy}-${mm}-${dd}`;

  dateInput.addEventListener("change", validateDayConstraint);
  dateInput.dataset.initialized = "1";
}

function validateDayConstraint() {
  const dateInput = $("pickupDate");
  if (!dateInput || !dateInput.value) return false;

  const selectedDate = new Date(dateInput.value + "T00:00:00");
  const day = selectedDate.getDay(); // 1=Mon, 3=Wed, 5=Fri

  if (day !== 1 && day !== 3 && day !== 5) {
    setError("pickupDateError", "Pickup only available on Monday, Wednesday or Friday.");
    return false;
  }

  setError("pickupDateError", "");
  return true;
}

// ---------- PAGE 4: SUMMARY ----------
function buildOrderLines() {
  const lines = [];
  let total = 0;

  const items = getSelectedLineItems();
  items.forEach((it) => {
    const addonNames = it.addons
      .map((aid) => addonsList.find((a) => a.id === aid)?.name)
      .filter(Boolean);
    const addonStr = addonNames.length ? ` + (${addonNames.join(", ")})` : "";
    const tempLabel = it.temp.toUpperCase();
    total += it.lineTotal;
    lines.push(`${it.qty} x ${it.name} (${tempLabel})${addonStr} — RM ${it.lineTotal.toFixed(2)}`);
  });

  return { lines, total };
}

function renderFinalSummary() {
  const container = $("finalOrderSummary");
  if (!container) return;

  const name = $("customerName")?.value.trim() || "Not provided";
  const phone = $("customerPhone")?.value.trim() || "Not provided";
  const date = $("pickupDate")?.value || "-";
  const time = $("pickupTime")?.value || "-";
  const { lines, total } = buildOrderLines();

  container.innerHTML = `
    <strong>🧾 ORDER SUMMARY</strong><br>
    👤 ${escapeHtml(name)} | ☎️ ${escapeHtml(phone)}<br>
    📅 Pickup: ${escapeHtml(date)} at ${escapeHtml(time)}<br><br>
    <strong>Drinks:</strong><br>
    ${lines.length ? lines.map((l) => `• ${escapeHtml(l)}`).join("<br>") : "— No drinks selected —"}<br><br>
    <strong>💰 TOTAL AMOUNT: RM ${total.toFixed(2)}</strong>
  `;
}

// ---------- VALIDATION ----------
function validateBeforeReview() {
  clearErrors();

  const name = $("customerName")?.value.trim() || "";
  const phone = $("customerPhone")?.value.trim() || "";
  const date = $("pickupDate")?.value || "";
  const time = $("pickupTime")?.value || "";

  let ok = true;

  if (!name) {
    setError("nameError", "Please enter your full name.");
    ok = false;
  }
  if (!phone) {
    setError("phoneError", "Please enter your contact number.");
    ok = false;
  }
  if (!date) {
    setError("pickupDateError", "Please select a pickup date.");
    ok = false;
  } else if (!validateDayConstraint()) {
    ok = false;
  }
  if (!time) {
    setError("pickupTimeError", "Please select a pickup time.");
    ok = false;
  }

  if (getSelectedLineItems().length === 0) {
    alert("☕ Please select at least one drink (quantity > 0).");
    ok = false;
  }

  return ok;
}

function validateBeforeSubmit() {
  clearErrors();
  const fileInput = $("paymentScreenshot");
  if (!fileInput || !fileInput.files || !fileInput.files.length) {
    setError("paymentError", "Please upload payment screenshot / proof.");
    return false;
  }
  return validateBeforeReview();
}

// ---------- SUBMIT ----------
async function submitFinalOrder() {
  if (!validateBeforeSubmit()) return;

  const name = $("customerName").value.trim();
  const phone = $("customerPhone").value.trim();
  const pickupDate = $("pickupDate").value;
  const pickupTime = $("pickupTime").value;

  const { lines, total } = buildOrderLines();
  const fileInput = $("paymentScreenshot");

  const formData = new FormData();
  formData.append("name", name);
  formData.append("phone", phone);
  formData.append("pickupDate", pickupDate);
  formData.append("pickupTime", pickupTime);
  formData.append("total", total.toFixed(2));
  formData.append("orderLines", lines.join("\n"));
  formData.append(
    "orderDetails",
    JSON.stringify({
      items: getSelectedLineItems().map((it) => ({
        id: it.id,
        name: it.name,
        qty: it.qty,
        temp: it.temp,
        addons: it.addons
      }))
    })
  );
  formData.append("screenshot", fileInput.files[0]);

  try {
    const response = await fetch("/api/submit-order", { method: "POST", body: formData });
    const contentType = response.headers.get("content-type") || "";

    /** @type {{ok?: boolean, error?: string}|null} */
    let result = null;
    let rawText = "";

    if (contentType.includes("application/json")) {
      result = await response.json().catch(() => null);
    } else {
      rawText = await response.text();
    }

    console.log("API Response:", { status: response.status, contentType, result, rawText });

    // Fix routing issues: if we get HTML here, the API is not being hit correctly.
    if (!contentType.includes("application/json")) {
      alert("❌ API Error: server returned HTML/text instead of JSON. Please run the site via npm run dev (http://localhost:3000).");
      return;
    }

    if (!response.ok || !result || result.ok !== true) {
      alert(`❌ Order failed: ${result?.error || `HTTP ${response.status}`}`);
      return;
    }

    alert("✅ Order submitted successfully!");
    resetAll();
    showPage(1);
  } catch (e) {
    console.error(e);
    alert("Network error. Check backend is running.");
  }
}

function resetAll() {
  initSelections();
  renderDrinksPage();
  $("customerName").value = "";
  $("customerPhone").value = "";
  $("pickupDate").value = "";
  $("paymentScreenshot").value = "";
  $("uploadPreview").innerHTML = "";
  clearErrors();
  updateSummaryPreview();
}

// ---------- ROUTING ----------
let currentPage = 1;

function showPage(pageNum) {
  const pages = document.querySelectorAll(".page");
  pages.forEach((pg, idx) => pg.classList.toggle("active-page", idx + 1 === pageNum));

  const steps = document.querySelectorAll(".step-btn");
  steps.forEach((btn) => btn.classList.toggle("active", Number(btn.dataset.step) === pageNum));

  if (pageNum === 2) {
    renderDrinksPage();
  }
  if (pageNum === 3) {
    initPickupTimes();
    setDateMinAndValidation();
  }
  if (pageNum === 4) {
    if (!validateBeforeReview()) {
      if (getSelectedLineItems().length === 0) showPage(2);
      return;
    }
    renderFinalSummary();
  }

  currentPage = pageNum;
}

function attachNavEvents() {
  document.querySelectorAll(".step-btn").forEach((btn) => {
    btn.addEventListener("click", () => showPage(Number(btn.dataset.step)));
  });
  document.querySelectorAll(".next-btn").forEach((btn) => {
    btn.addEventListener("click", () => showPage(Number(btn.dataset.next)));
  });
  document.querySelectorAll(".prev-btn").forEach((btn) => {
    btn.addEventListener("click", () => showPage(Number(btn.dataset.prev)));
  });
}

// ---------- MISC UI ----------
function initImagePlaceholders() {
  const img1 = $("customMenuImg1");
  const place1 = $("menuImgPlace1");
  if (img1 && place1 && img1.getAttribute("src")) place1.style.display = "none";
}

function initUploadPreview() {
  const screenshotInput = $("paymentScreenshot");
  const previewDiv = $("uploadPreview");
  if (!screenshotInput || !previewDiv) return;

  screenshotInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      previewDiv.innerHTML = "";
      return;
    }
    const url = URL.createObjectURL(file);
    previewDiv.innerHTML = `✅ ${escapeHtml(file.name)}<br><img src="${url}" alt="Payment screenshot preview">`;
  });
}

// ---------- INIT ----------
function main() {
  initSelections();
  attachNavEvents();
  attachDrinkEvents();
  initUploadPreview();
  initImagePlaceholders();
  const submitBtn = $("finalSubmitBtn");
  if (submitBtn) submitBtn.addEventListener("click", submitFinalOrder);
  showPage(1);
}

document.addEventListener("DOMContentLoaded", main);
