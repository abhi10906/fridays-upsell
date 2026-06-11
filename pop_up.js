(function () {
  "use strict";

  // ─────────────────────────────────────────────────────────────────
  // UPSELL PATH CONFIG
 
  const UPSELL_PATHS = {

    // PATH 1: User clicks "Medication Only" → upsell to "Monthly Auto-Refill"
    "211": {
      upgradeValue: "3",
      modal: {
        topBadge:      "🔥 Most Popular for New Patients",
        headline:      "Commit to Results &amp; <span class='ff-green'>Save $130 Instantly</span>",
        subCopy:       "92% of visible results happen by Day 90.",
        productBadge:  "↻ Monthly Auto-Refill",
        productName:   "3-Month Supply",
        productSub:    "Tirzepatide GLP-1/GIP",
        benefits:      [
          "Unlimited Provider Visits",
          "Guaranteed Support",
          "New Supply Every Month"
        ],
        priceNew:      "$259",
        priceUnit:     "/mo",
        priceOld:      "$389",
        savingsBadge:  "SAVE $130",
        billingNote:   "Billed every 28 days ($259). Cancel anytime.",
        ctaUpgrade:    "UPGRADE MY PLAN",
        ctaDecline:    "I'll Stick To The Higher Monthly Rate"
      }
    },

    // PATH 2: User clicks "Monthly Auto-Refill" → upsell to "3-Month Supply"
    "3": {
      upgradeValue: "231",
      modal: {
        topBadge:      "🔥 Most Popular for New Patients",
        headline:      "Commit to Results &amp; <span class='ff-green'>Save $471 Instantly</span>",
        subCopy:       "92% of visible results happen by Day 90.",
        productBadge:  "↻ Monthly Auto-Refill",
        productName:   "3-Month Supply",
        productSub:    "Tirzepatide GLP-1/GIP",
        benefits:      [
          "Unlimited Provider Visits",
          "Guaranteed Support",
          "New Supply Every Month"
        ],
        priceNew:      "$232",
        priceUnit:     "/mo",
        priceOld:      "$389",
        savingsBadge:  "SAVE $471",
        billingNote:   "Billed every 28 days ($232). Cancel anytime.",
        ctaUpgrade:    "UPGRADE MY PLAN",
        ctaDecline:    "I'll Stick To The Higher Monthly Rate"
      }
    }

  };

  // STATE

  let originallyClickedLabel = null; // the label the user originally clicked
  let currentUpgradeValue    = null; // which plan to select on upgrade
  let isListenerAttached     = false;
  let currentUrl             = location.href;

  
  // STYLES — injected once
  function injectStyles() {
    if (document.getElementById("ff-upsell-styles")) return;

    const style = document.createElement("style");
    style.id = "ff-upsell-styles";
    style.textContent = `

      /* ── Overlay backdrop ── */
      #ff-upsell-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 99999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      #ff-upsell-overlay.ff-visible {
        opacity: 1;
      }

      /* ── Modal wrapper ── */
      #ff-upsell-modal {
        background: #ffffff;
        border-radius: 20px;
        width: 100%;
        max-width: 520px;
        overflow: hidden;
        box-shadow: 0 24px 60px rgba(0,0,0,0.2);
        transform: translateY(28px);
        transition: transform 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #ff-upsell-overlay.ff-visible #ff-upsell-modal {
        transform: translateY(0);
      }

      /* ── Dark top bar ── */
      #ff-modal-topbar {
        background: #1a1a1a;
        color: #ffffff;
        text-align: center;
        padding: 14px 20px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      #ff-modal-topbar .ff-check-icon {
        width: 20px;
        height: 20px;
        background: #5CC12E;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        flex-shrink: 0;
      }

      /* ── Modal body ── */
      #ff-modal-body {
        padding: 28px 28px 24px;
      }

      /* ── Top badge (flame) ── */
      .ff-top-badge {
        display: inline-block;
        background: #f3f4f6;
        color: #374151;
        font-size: 13px;
        font-weight: 500;
        padding: 6px 14px;
        border-radius: 100px;
        margin-bottom: 16px;
      }

      /* ── Headline ── */
      #ff-modal-headline {
        font-size: 26px;
        font-weight: 800;
        color: #111827;
        margin: 0 0 8px;
        line-height: 1.25;
      }
      #ff-modal-headline .ff-green {
        color: #5CC12E;
      }

      /* ── Sub copy ── */
      .ff-sub-copy {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 20px;
        font-weight: 500;
      }

      /* ── Product card ── */
      .ff-product-card {
        border: 1.5px solid #e5e7eb;
        border-radius: 14px;
        padding: 16px;
        margin-bottom: 0;
        display: flex;
        gap: 14px;
        align-items: flex-start;
      }

      /* ── Product image placeholder ── */
      .ff-product-img {
        width: 80px;
        height: 80px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
      }

      /* ── Product details ── */
      .ff-product-details {
        flex: 1;
        min-width: 0;
      }
      .ff-product-badge {
        display: inline-block;
        background: #d1fae5;
        color: #065f46;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 100px;
        margin-bottom: 6px;
      }
      .ff-product-name {
        font-size: 16px;
        font-weight: 800;
        color: #111827;
        margin-bottom: 2px;
      }
      .ff-product-sub {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 8px;
      }
      .ff-product-benefits {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .ff-product-benefits li {
        font-size: 12px;
        color: #374151;
        padding: 1px 0;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ff-product-benefits li::before {
        content: "✓";
        color: #5CC12E;
        font-weight: 700;
        font-size: 13px;
        flex-shrink: 0;
      }

      /* ── Pricing block (right side of card) ── */
      .ff-pricing-block {
        text-align: right;
        flex-shrink: 0;
      }
      .ff-price-new {
        font-size: 26px;
        font-weight: 800;
        color: #111827;
        line-height: 1;
      }
      .ff-price-unit {
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
      }
      .ff-price-old {
        font-size: 13px;
        color: #9ca3af;
        text-decoration: line-through;
        margin: 4px 0;
      }
      .ff-savings-badge {
        display: inline-block;
        background: #c8922a;
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        padding: 4px 10px;
        border-radius: 6px;
        letter-spacing: 0.04em;
      }

      /* ── Divider ── */
      .ff-divider {
        height: 1px;
        background: #e5e7eb;
        margin: 20px 0;
      }

      /* ── Upgrade CTA button ── */
      #ff-btn-upgrade {
        width: 100%;
        background: #3d5a2a;
        color: #ffffff;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        border: none;
        border-radius: 12px;
        padding: 17px;
        cursor: pointer;
        transition: background 0.2s, transform 0.1s;
        margin-bottom: 10px;
      }
      #ff-btn-upgrade:hover  { background: #2e4520; }
      #ff-btn-upgrade:active { transform: scale(0.98); }

      /* ── Billing note ── */
      .ff-billing-note {
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
        margin-bottom: 14px;
      }

      /* ── Decline link ── */
      #ff-btn-decline {
        display: block;
        width: 100%;
        text-align: center;
        font-size: 13px;
        color: #374151;
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        text-decoration: underline;
        text-underline-offset: 3px;
        transition: color 0.2s;
      }
      #ff-btn-decline:hover { color: #111827; }

      /* ── Mobile responsive ── */
      @media (max-width: 520px) {
        #ff-modal-body { padding: 20px 16px 18px; }
        #ff-modal-headline { font-size: 20px; }
        .ff-product-img { width: 60px; height: 60px; font-size: 22px; }
        .ff-price-new { font-size: 22px; }
        #ff-btn-upgrade { font-size: 14px; padding: 15px; }
      }
    `;
    document.head.appendChild(style);
  }

  // BUILD MODAL SHELL — only once, content is updated dynamically
  
  function buildModal() {
    if (document.getElementById("ff-upsell-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "ff-upsell-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "ff-modal-headline");

    overlay.innerHTML = `
      <div id="ff-upsell-modal">

        <!-- Dark top bar -->
        <div id="ff-modal-topbar">
          <span class="ff-check-icon">✓</span>
          RECOMMENDED PLAN UPGRADE
        </div>

        <!-- Modal body — filled dynamically -->
        <div id="ff-modal-body">

          <span class="ff-top-badge" id="ff-top-badge"></span>

          <h2 id="ff-modal-headline"></h2>
          <p class="ff-sub-copy" id="ff-sub-copy"></p>

          <!-- Product card -->
          <div class="ff-product-card">
            <div class="ff-product-img">💊</div>
            <div class="ff-product-details">
              <span class="ff-product-badge" id="ff-product-badge"></span>
              <div class="ff-product-name" id="ff-product-name"></div>
              <div class="ff-product-sub"  id="ff-product-sub"></div>
              <ul class="ff-product-benefits" id="ff-product-benefits"></ul>
            </div>
            <div class="ff-pricing-block">
              <div>
                <span class="ff-price-new" id="ff-price-new"></span>
                <span class="ff-price-unit" id="ff-price-unit"></span>
              </div>
              <div class="ff-price-old" id="ff-price-old"></div>
              <span class="ff-savings-badge" id="ff-savings-badge"></span>
            </div>
          </div>

          <div class="ff-divider"></div>

          <button id="ff-btn-upgrade"></button>
          <p class="ff-billing-note" id="ff-billing-note"></p>
          <button id="ff-btn-decline"></button>

        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Wire up button events
    document.getElementById("ff-btn-upgrade").addEventListener("click", handleUpgrade);
    document.getElementById("ff-btn-decline").addEventListener("click", handleDecline);

    // Click on backdrop = decline
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) handleDecline();
    });
  }

  // POPULATE MODAL with the correct path's content
  function populateModal(config) {
    document.getElementById("ff-top-badge").textContent        = config.topBadge;
    document.getElementById("ff-modal-headline").innerHTML     = config.headline;
    document.getElementById("ff-sub-copy").textContent         = config.subCopy;
    document.getElementById("ff-product-badge").textContent    = config.productBadge;
    document.getElementById("ff-product-name").textContent     = config.productName;
    document.getElementById("ff-product-sub").textContent      = config.productSub;
    document.getElementById("ff-price-new").textContent        = config.priceNew;
    document.getElementById("ff-price-unit").textContent       = config.priceUnit;
    document.getElementById("ff-price-old").textContent        = config.priceOld;
    document.getElementById("ff-savings-badge").textContent    = config.savingsBadge;
    document.getElementById("ff-billing-note").textContent     = config.billingNote;
    document.getElementById("ff-btn-upgrade").textContent      = config.ctaUpgrade;
    document.getElementById("ff-btn-decline").textContent      = config.ctaDecline;

    // Build benefits list
    const ul = document.getElementById("ff-product-benefits");
    ul.innerHTML = "";
    config.benefits.forEach(function (benefit) {
      const li = document.createElement("li");
      li.textContent = benefit;
      ul.appendChild(li);
    });
  }

  // SHOW / HIDE MODAL
  function showModal() {
    const overlay = document.getElementById("ff-upsell-overlay");
    if (!overlay) return;
    overlay.style.display = "flex";
    // Double rAF ensures CSS transition fires after display:flex is painted
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("ff-visible");
      });
    });
    document.body.style.overflow = "hidden";
  }

  function hideModal() {
    const overlay = document.getElementById("ff-upsell-overlay");
    if (!overlay) return;
    overlay.classList.remove("ff-visible");
    document.body.style.overflow = "";
    setTimeout(function () {
      overlay.style.display = "none";
    }, 300);
  }

  // PLAN SELECTION — programmatically clicks the radio button
  function selectPlanByValue(value) {
    const btn = document.querySelector('button[role="radio"][value="' + value + '"]');
    if (btn) {
      btn.click();
      console.log("[FF Upsell] ✅ Plan selected:", value);
    } else {
      console.warn("[FF Upsell] ⚠️ Could not find plan button with value:", value);
    }
  }

  // BUTTON HANDLERS
  function handleUpgrade() {
    hideModal();
    selectPlanByValue(currentUpgradeValue);
    // Reset state
    originallyClickedLabel = null;
    currentUpgradeValue    = null;
  }

  function handleDecline() {
    hideModal();
    // Re-select the plan the user originally clicked
    if (originallyClickedLabel) {
      const btn = originallyClickedLabel.querySelector('button[role="radio"]');
      if (btn) btn.click();
    }
    // Reset state
    originallyClickedLabel = null;
    currentUpgradeValue    = null;
  }

  // INTERCEPT PLAN CLICKS

  function handlePlanClick(e) {
    const label = e.target.closest('label[data-slot="radio-group-item"]');
    if (!label) return;

    const radioBtn = label.querySelector('button[role="radio"]');
    if (!radioBtn) return;

    const clickedValue = radioBtn.getAttribute("value");

    const path = UPSELL_PATHS[clickedValue];
    if (!path) return; // not an intercepted plan, let it behave normally

    e.preventDefault();
    e.stopPropagation();

    originallyClickedLabel = label;
    currentUpgradeValue    = path.upgradeValue;

    populateModal(path.modal);

    // Show it
    showModal();

    console.log("[FF Upsell] Intercepted plan:", clickedValue, "→ upsell to:", path.upgradeValue);
  }

  // ATTACH LISTENER TO RADIO GROUP
  function attachPlanListener() {
    const radioGroup = document.querySelector('[role="radiogroup"][data-slot="radio-group"]');
    if (!radioGroup) return false;

    if (radioGroup.dataset.ffAttached === "true") return true;
    radioGroup.dataset.ffAttached = "true";

    radioGroup.addEventListener("click", handlePlanClick, true);
    isListenerAttached = true;

    console.log("[FF Upsell] ✅ Listener attached to radiogroup");
    return true;
  }

  // SPA NAVIGATION WATCHER

  function watchForPage() {

    // 1. MutationObserver — re-attaches listener when DOM rebuilds
    const observer = new MutationObserver(function () {
      if (location.href !== currentUrl) {
        currentUrl = location.href;
        isListenerAttached = false;
        console.log("[FF Upsell] URL changed:", currentUrl);
      }
      if (!isListenerAttached) {
        attachPlanListener();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 2. Patch history.pushState (SPA forward navigation)
    var originalPushState = history.pushState.bind(history);
    history.pushState = function () {
      originalPushState.apply(history, arguments);
      isListenerAttached = false;
      currentUrl = location.href;
    };

    // 3. Patch history.replaceState
    var originalReplaceState = history.replaceState.bind(history);
    history.replaceState = function () {
      originalReplaceState.apply(history, arguments);
      isListenerAttached = false;
      currentUrl = location.href;
    };

    // 4. Browser back / forward button
    window.addEventListener("popstate", function () {
      isListenerAttached = false;
      currentUrl = location.href;
    });
  }

  // INIT
  function init() {
    console.log("[FF Upsell] Initializing...");
    injectStyles();
    buildModal();
    attachPlanListener();
    watchForPage();
    console.log("[FF Upsell] Ready ✅");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();