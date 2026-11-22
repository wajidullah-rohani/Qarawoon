(function () {
  "use strict";

  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase && typeof window.supabase.from === "function") {
      return window.supabase;
    }

    const rawUrl = typeof SUPABASE_URL === "string" ? SUPABASE_URL.trim() : "";
    const rawKey = typeof SUPABASE_ANON_KEY === "string" ? SUPABASE_ANON_KEY.trim() : "";
    const match = rawUrl.match(/https:\/\/[a-zA-Z0-9-]+\.supabase\.co/);
    const url = match ? match[0] : rawUrl.replace(/\/+$/, "");
    const key = rawKey.replace(/\s+/g, "");

    if (url && key && window.supabase && typeof window.supabase.createClient === "function") {
      window.supabaseClient = window.supabase.createClient(url, key);
      return window.supabaseClient;
    }
    return null;
  }

  function esc(str) {
    const div = document.createElement("div");
    div.textContent = String(str || "");
    return div.innerHTML;
  }

  const client = getClient();
  const poemsContainer = document.getElementById("poems-container");
  const searchInput = document.getElementById("search-input");
  const categorySelect = document.getElementById("category-select");
  const themeBtn = document.getElementById("theme-toggle-btn");
  const fontDecBtn = document.getElementById("font-dec-btn");
  const fontResetBtn = document.getElementById("font-reset-btn");
  const fontIncBtn = document.getElementById("font-inc-btn");

  const modal = document.getElementById("poem-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalCopyBtn = document.getElementById("modal-copy-btn");
  const copyFeedback = document.getElementById("copy-feedback");

  let allPoems = [];
  let activePoem = null;
  let fontScale = 1;

  // Theme handling
  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-theme", isDark);
    if (themeBtn) {
      themeBtn.textContent = isDark ? "د ورځې حالت" : "د شپې حالت";
    }
    try {
      localStorage.setItem("qarawoon_theme", isDark ? "dark" : "light");
    } catch (_) {}
  }

  try {
    const savedTheme = localStorage.getItem("qarawoon_theme");
    if (savedTheme) applyTheme(savedTheme);
  } catch (_) {}

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("dark-theme") ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }

  // Font scaling
  function applyFontScale(scale) {
    fontScale = Math.min(1.4, Math.max(0.85, Number(scale.toFixed(2))));
    document.documentElement.style.setProperty("--poem-font-scale", String(fontScale));
    try {
      localStorage.setItem("qarawoon_font_scale", String(fontScale));
    } catch (_) {}
  }

  try {
    const savedScale = parseFloat(localStorage.getItem("qarawoon_font_scale") || "1");
    if (!Number.isNaN(savedScale)) applyFontScale(savedScale);
  } catch (_) {}

  if (fontDecBtn) fontDecBtn.addEventListener("click", () => applyFontScale(fontScale - 0.1));
  if (fontResetBtn) fontResetBtn.addEventListener("click", () => applyFontScale(1));
  if (fontIncBtn) fontIncBtn.addEventListener("click", () => applyFontScale(fontScale + 0.1));

  // Populate categories
  function populateCategories(poems) {
    if (!categorySelect) return;
    const currentVal = categorySelect.value || "all";
    const categories = Array.from(
      new Set(
        poems
          .map((p) => (p.category || "").trim())
          .filter((c) => c.length > 0)
      )
    );

    categorySelect.innerHTML = `<option value="all">ټولې کټګورۍ</option>` +
      categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");

    if (categories.includes(currentVal)) {
      categorySelect.value = currentVal;
    } else {
      categorySelect.value = "all";
    }
  }

  // Render poems
  function renderPoems() {
    if (!poemsContainer) return;

    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const selectedCategory = categorySelect ? categorySelect.value : "all";

    const filtered = allPoems.filter((poem) => {
      const cat = (poem.category || "").trim();
      const matchesCat = selectedCategory === "all" || cat === selectedCategory;
      if (!matchesCat) return false;

      if (!query) return true;
      const haystack = [poem.title, poem.poet, poem.category, poem.content]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    if (filtered.length === 0) {
      poemsContainer.innerHTML = `
        <div class="empty-state">
          <p>ستاسو د لټون یا کټګورۍ مطابق کوم شعر ونه موندل شو.</p>
        </div>`;
      return;
    }

    poemsContainer.innerHTML = filtered
      .map(
        (poem) => `
        <article class="poem-card" data-id="${esc(poem.id)}">
          <div class="poem-card-top">
            <span class="poem-badge">${esc(poem.category || "شعر")}</span>
            <span class="poem-poet">${esc(poem.poet || "")}</span>
          </div>
          <h3 class="poem-title">${esc(poem.title)}</h3>
          <div class="poem-body poem-body--clamped">${esc(poem.content).replace(/\n/g, "<br>")}</div>
          <div class="poem-card-actions">
            <button type="button" class="btn-ghost open-poem-btn" data-id="${esc(poem.id)}">بشپړ لوستل</button>
          </div>
        </article>`
      )
      .join("");

    poemsContainer.querySelectorAll(".open-poem-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const found = allPoems.find((item) => String(item.id) === String(id));
        if (found) openPoemModal(found);
      });
    });
  }

  // Modal controls
  function openPoemModal(poem) {
    activePoem = poem;
    if (!modal) return;
    document.getElementById("modal-poem-category").textContent = poem.category || "شعر";
    document.getElementById("modal-poem-title").textContent = poem.title || "";
    document.getElementById("modal-poem-poet").textContent = poem.poet || "";
    document.getElementById("modal-poem-body").innerHTML = esc(poem.content).replace(/\n/g, "<br>");
    if (copyFeedback) copyFeedback.textContent = "";
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
  }

  function closePoemModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    activePoem = null;
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closePoemModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closePoemModal();
    });
  }

  if (modalCopyBtn) {
    modalCopyBtn.addEventListener("click", async () => {
      if (!activePoem) return;
      const textToCopy = [
        activePoem.title,
        activePoem.poet ? "شاعر: " + activePoem.poet : "",
        "",
        activePoem.content
      ]
        .filter(Boolean)
        .join("\n");

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          const ta = document.createElement("textarea");
          ta.value = textToCopy;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        if (copyFeedback) copyFeedback.textContent = "شعر کاپي شو!";
      } catch (_) {
        if (copyFeedback) copyFeedback.textContent = "کاپي کول ممکن نه شول.";
      }
    });
  }

  // Load poems from Supabase
  async function loadPoems() {
    if (!poemsContainer) return;

    if (!client) {
      poemsContainer.innerHTML = `
        <div class="error-card">
          <p>د ډیټابیس اتصال پیدا نه شو. مهرباني وکړئ supabase-config.js وګورئ.</p>
        </div>`;
      return;
    }

    try {
      const { data, error } = await client
        .from("poems")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        poemsContainer.innerHTML = `
          <div class="error-card">
            <p>د شعرونو په راوړلو کې ستونزه: ${esc(error.message)}</p>
          </div>`;
        return;
      }

      allPoems = Array.isArray(data) ? data : [];
      populateCategories(allPoems);
      renderPoems();
    } catch (err) {
      poemsContainer.innerHTML = `
        <div class="error-card">
          <p>ناڅاپي ستونزه: ${esc(err && err.message ? err.message : "")}</p>
        </div>`;
    }
  }

  // Feedback form submission
  const feedbackForm = document.getElementById("feedback-form");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const statusEl = document.getElementById("feedback-status");
      const submitBtn = document.getElementById("feedback-submit-btn");
      const nameInput = document.getElementById("feedback-name");
      const msgInput = document.getElementById("feedback-message");

      const name = (nameInput ? nameInput.value : "").trim();
      const message = (msgInput ? msgInput.value : "").trim();

      if (!name || !message) {
        if (statusEl) statusEl.textContent = "مهرباني وکړئ خپل نوم او پیغام دواړه ولیکئ.";
        return;
      }

      if (!client) {
        if (statusEl) statusEl.textContent = "د ډیټابیس اتصال نشته.";
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (statusEl) statusEl.textContent = "پیغام لېږل کېږي...";

      try {
        const { error } = await client
          .from("feedback")
          .insert([{ name, message }]);

        if (error) {
          if (statusEl) statusEl.textContent = "ستونزه: " + error.message;
        } else {
          if (statusEl) statusEl.textContent = "مننه! ستاسو نظر په بریالیتوب ولېږل شو.";
          feedbackForm.reset();
        }
      } catch (err) {
        if (statusEl) statusEl.textContent = "ناڅاپي ستونزه: " + (err && err.message ? err.message : "");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  if (searchInput) searchInput.addEventListener("input", renderPoems);
  if (categorySelect) categorySelect.addEventListener("change", renderPoems);

  loadPoems();
})(); 
