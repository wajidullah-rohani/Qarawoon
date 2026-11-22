function getSupabaseClient() {
  if (window.supabaseClient) return window.supabaseClient;
  if (window.supabase && typeof window.supabase.from === "function") {
    return window.supabase;
  }

  const rawUrl = typeof SUPABASE_URL === "string" ? SUPABASE_URL.trim() : "";
  const rawKey = typeof SUPABASE_ANON_KEY === "string" ? SUPABASE_ANON_KEY.trim() : "";

  const urlMatch = rawUrl.match(/https:\/\/[a-zA-Z0-9-]+\.supabase\.co/);
  const cleanUrl = urlMatch ? urlMatch[0] : rawUrl.replace(/\/+$/, "");
  const cleanKey = rawKey.replace(/\s+/g, "");

  if (
    cleanUrl &&
    cleanKey &&
    window.supabase &&
    typeof window.supabase.createClient === "function"
  ) {
    window.supabaseClient = window.supabase.createClient(cleanUrl, cleanKey);
    return window.supabaseClient;
  }

  return null;
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

function formatPoemBody(poem) {
  return (
    poem.content ||
    poem.body ||
    poem.text ||
    poem.poem_text ||
    poem.verses ||
    ""
  );
}

function formatPoemTitle(poem) {
  return poem.title || poem.name || "بې سرلیکه شعر";
}

function formatPoetName(poem) {
  return poem.poet || poem.author || "";
}

function formatPoemCategory(poem) {
  return poem.category || poem.genre || "شعري ټولګه";
}

let allPoemsCache = [];
let currentFontScale = 1;

function renderPoemsList(poems) {
  const poemsListEl = document.getElementById("poems-list");
  if (!poemsListEl) return;

  if (!poems || poems.length === 0) {
    poemsListEl.innerHTML =
      '<div class="empty-state"><p>د دې لټون یا ډول مطابق کوم شعر ونه موندل شو.</p></div>';
    return;
  }

  poemsListEl.innerHTML = poems
    .map((poem, index) => {
      const title = escapeHtml(formatPoemTitle(poem));
      const poet = escapeHtml(formatPoetName(poem));
      const category = escapeHtml(formatPoemCategory(poem));
      const rawBody = formatPoemBody(poem);
      const content = escapeHtml(rawBody).replace(/\n/g, "<br>");
      const isLong = rawBody.length > 360;

      return `
        <article class="poem-card" data-index="${index}">
          <div class="poem-card-top">
            <span class="poem-badge">${category}</span>
            ${poet ? `<span class="poem-poet">${poet}</span>` : ""}
          </div>
          <h3 class="poem-title">${title}</h3>
          <div class="poem-body ${isLong ? "poem-body--clamped" : ""}" id="poem-body-${index}">${content}</div>
          <div class="poem-card-actions">
            ${
              isLong
                ? `<button type="button" class="btn-ghost toggle-poem-btn" data-target="poem-body-${index}">بشپړ لوستل</button>`
                : ""
            }
            <button type="button" class="btn-ghost copy-poem-btn" data-index="${index}">کاپي شعر</button>
          </div>
        </article>
      `;
    })
    .join("");

  poemsListEl.querySelectorAll(".toggle-poem-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const bodyEl = document.getElementById(targetId);
      if (!bodyEl) return;
      const expanded = bodyEl.classList.toggle("poem-body--expanded");
      bodyEl.classList.toggle("poem-body--clamped", !expanded);
      btn.textContent = expanded ? "لنډول" : "بشپړ لوستل";
    });
  });

  poemsListEl.querySelectorAll(".copy-poem-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.getAttribute("data-index"));
      const item = poems[idx];
      if (!item) return;
      const shareText = `${formatPoemTitle(item)}${
        formatPoetName(item) ? " — " + formatPoetName(item) : ""
      }\n\n${formatPoemBody(item)}`;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareText);
          const oldLabel = btn.textContent;
          btn.textContent = "کاپي شو ✓";
          setTimeout(() => {
            btn.textContent = oldLabel;
          }, 1800);
        }
      } catch (_) {
        // که براوزر کاپي اجازه ورنکړي، خاموش پاتې شي
      }
    });
  });
}

function populateCategoryFilter(poems) {
  const selectEl = document.getElementById("poem-category-filter");
  if (!selectEl) return;

  const categories = Array.from(
    new Set(
      poems
        .map((p) => formatPoemCategory(p))
        .filter((c) => c && c.trim().length > 0)
    )
  );

  selectEl.innerHTML =
    '<option value="ALL">ټولې برخې</option>' +
    categories
      .map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`)
      .join("");
}

function applyPoemFilters() {
  const searchInput = document.getElementById("poem-search-input");
  const categorySelect = document.getElementById("poem-category-filter");

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const category = categorySelect ? categorySelect.value : "ALL";

  const filtered = allPoemsCache.filter((poem) => {
    const title = formatPoemTitle(poem).toLowerCase();
    const poet = formatPoetName(poem).toLowerCase();
    const body = formatPoemBody(poem).toLowerCase();
    const cat = formatPoemCategory(poem);

    const matchesCategory = category === "ALL" || cat === category;
    const matchesQuery =
      !query ||
      title.includes(query) ||
      poet.includes(query) ||
      body.includes(query);

    return matchesCategory && matchesQuery;
  });

  renderPoemsList(filtered);
}

async function loadPoems() {
  const poemsListEl = document.getElementById("poems-list");
  if (!poemsListEl) return;

  const client = getSupabaseClient();
  if (!client) {
    poemsListEl.innerHTML =
      '<div class="error-card"><p>د ډیټابیس اتصال پیدا نه شو. مهرباني وکړئ supabase-config.js وګورئ.</p></div>';
    return;
  }

  poemsListEl.innerHTML = `
    <div class="skeleton-grid" aria-busy="true">
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    </div>
  `;

  try {
    const { data, error } = await client
      .from("poems")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      poemsListEl.innerHTML = `<div class="error-card"><p>د شعرونو په راوړلو کې ستونزه: ${escapeHtml(error.message)}</p></div>`;
      return;
    }

    allPoemsCache = Array.isArray(data) ? data : [];

    if (allPoemsCache.length === 0) {
      poemsListEl.innerHTML =
        '<div class="empty-state"><p>تر اوسه کوم شعر نه دی اضافه شوی.</p></div>';
      return;
    }

    populateCategoryFilter(allPoemsCache);
    renderPoemsList(allPoemsCache);
  } catch (err) {
    poemsListEl.innerHTML = `<div class="error-card"><p>ناڅاپي ستونزه رامنځته شوه: ${escapeHtml(err && err.message ? err.message : "")}</p></div>`;
  }
}

let lastFeedbackTime = 0;

async function handleFeedbackSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const nameInput =
    document.getElementById("sender-name") ||
    form.querySelector('input[name="name"], input[type="text"]');
  const messageInput =
    document.getElementById("feedback-message") ||
    form.querySelector("textarea");
  const statusEl =
    document.getElementById("feedback-status") ||
    form.querySelector("[id*='status'], .feedback-status");
  const submitBtn = form.querySelector('button[type="submit"]');

  const name = nameInput ? nameInput.value.trim().slice(0, 80) : "";
  const message = messageInput ? messageInput.value.trim().slice(0, 1500) : "";

  if (!message) {
    if (statusEl) statusEl.textContent = "مهرباني وکړئ خپل نظر یا پیغام ولیکئ.";
    return;
  }

  const now = Date.now();
  if (now - lastFeedbackTime < 4000) {
    if (statusEl) {
      statusEl.textContent = "مهرباني وکړئ څو شېبې صبر وکړئ او بیا پیغام ولېږئ.";
    }
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (statusEl) statusEl.textContent = "پیغام لېږل کېږي...";

  const payload = {
    name: name || "ورکوونکی",
    message: message
  };

  const client = getSupabaseClient();

  try {
    if (client) {
      const { error } = await client.from("feedback").insert([payload]);

      if (error) {
        if (typeof saveFeedbackLocally === "function") saveFeedbackLocally(payload);
        if (statusEl) {
          statusEl.textContent = `مستقیم ونه لېږل شو (${error.message})، خو پیغام په موقت ډول خوندي شو.`;
        }
      } else {
        lastFeedbackTime = Date.now();
        if (nameInput) nameInput.value = "";
        if (messageInput) messageInput.value = "";
        if (statusEl) statusEl.textContent = "ستاسو نظر په بریالیتوب ولېږل شو. مننه!";
      }
    } else {
      if (typeof saveFeedbackLocally === "function") saveFeedbackLocally(payload);
      if (nameInput) nameInput.value = "";
      if (messageInput) messageInput.value = "";
      if (statusEl) statusEl.textContent = "پیغام په موقت ډول خوندي شو.";
    }
  } catch (err) {
    if (typeof saveFeedbackLocally === "function") saveFeedbackLocally(payload);
    if (statusEl) {
      statusEl.textContent = "د لېږلو پر وخت ستونزه راغله، پیغام موقتاً خوندي شو.";
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function setupReaderControls() {
  const fontIncreaseBtn = document.getElementById("font-increase-btn");
  const fontDecreaseBtn = document.getElementById("font-decrease-btn");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");

  const updateScale = () => {
    document.documentElement.style.setProperty(
      "--poem-font-scale",
      String(currentFontScale.toFixed(2))
    );
  };

  if (fontIncreaseBtn) {
    fontIncreaseBtn.addEventListener("click", () => {
      currentFontScale = Math.min(1.35, currentFontScale + 0.08);
      updateScale();
    });
  }

  if (fontDecreaseBtn) {
    fontDecreaseBtn.addEventListener("click", () => {
      currentFontScale = Math.max(0.88, currentFontScale - 0.08);
      updateScale();
    });
  }

  if (themeToggleBtn) {
    const savedTheme = localStorage.getItem("qarawoon_theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark-theme");
    }

    themeToggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-theme");
      localStorage.setItem("qarawoon_theme", isDark ? "dark" : "light");
    });
  }

  const searchInput = document.getElementById("poem-search-input");
  const categorySelect = document.getElementById("poem-category-filter");

  if (searchInput) {
    searchInput.addEventListener("input", applyPoemFilters);
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", applyPoemFilters);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupReaderControls();
  loadPoems();

  const feedbackForm = document.getElementById("feedback-form");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", handleFeedbackSubmit);
  }
}); 
