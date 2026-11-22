function getSupabaseClient() {
  if (window.supabaseClient) return window.supabaseClient;
  if (window.supabase && typeof window.supabase.from === "function") {
    return window.supabase;
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

async function loadPoems() {
  const poemsListEl = document.getElementById("poems-list");
  if (!poemsListEl) return;

  const client = getSupabaseClient();
  if (!client) {
    poemsListEl.innerHTML =
      "<p>د ډیټابیس اتصال پیدا نه شو. مهرباني وکړئ supabase-config.js وګورئ.</p>";
    return;
  }

  poemsListEl.innerHTML = "<p>شعرونه لودېږي...</p>";

  try {
    const { data, error } = await client
      .from("poems")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      poemsListEl.innerHTML = `<p>د شعرونو په راوړلو کې ستونزه: ${escapeHtml(error.message)}</p>`;
      return;
    }

    if (!data || data.length === 0) {
      poemsListEl.innerHTML = "<p>تر اوسه کوم شعر نه دی اضافه شوی.</p>";
      return;
    }

    poemsListEl.innerHTML = data
      .map((poem) => {
        const title = escapeHtml(formatPoemTitle(poem));
        const poet = escapeHtml(formatPoetName(poem));
        const content = escapeHtml(formatPoemBody(poem)).replace(/\n/g, "<br>");

        return `
          <article class="poem-card">
            <h3>${title}</h3>
            ${poet ? `<p class="poem-poet">${poet}</p>` : ""}
            <div class="poem-body">${content}</div>
          </article>
        `;
      })
      .join("");
  } catch (err) {
    poemsListEl.innerHTML = "<p>ناڅاپي ستونزه رامنځته شوه.</p>";
  }
}

async function handleFeedbackSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById("sender-name");
  const messageInput = document.getElementById("feedback-message");
  const statusEl = document.getElementById("feedback-status");
  const submitBtn = event.target.querySelector('button[type="submit"]');

  const name = nameInput ? nameInput.value.trim() : "";
  const message = messageInput ? messageInput.value.trim() : "";

  if (!message) {
    if (statusEl) statusEl.textContent = "مهرباني وکړئ خپل نظر یا پیغام ولیکئ.";
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

document.addEventListener("DOMContentLoaded", () => {
  loadPoems();

  const feedbackForm = document.getElementById("feedback-form");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", handleFeedbackSubmit);
  }
}); 
