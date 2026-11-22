function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSupabaseClient() {
  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    return supabaseClient;
  }
  if (typeof window !== "undefined" && window.supabaseClient) {
    return window.supabaseClient;
  }
  return null;
}

async function loadPoems() {
  const listEl = document.getElementById("poems-list");
  const client = getSupabaseClient();
  if (!listEl || !client) return;

  try {
    const { data, error } = await client
      .from("poems")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      listEl.innerHTML = "<p>د شعرونو په راوړلو کې ستونزه راغله.</p>";
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      listEl.innerHTML =
        "<p>تر اوسه شعرونه نشته؛ وروسته به د مدیر له پاڼې ورزیات شي.</p>";
      return;
    }

    listEl.innerHTML = data
      .map(
        (poem) => `
      <article class="poem-card">
        <h3>${escapeHtml(poem.title || "بې سرلیکه")}</h3>
        <p>${escapeHtml(poem.body || "")}</p>
      </article>
    `
      )
      .join("");
  } catch (_err) {
    listEl.innerHTML = "<p>د شعرونو په راوړلو کې ستونزه راغله.</p>";
  }
}

async function initFeedbackForm() {
  const form = document.getElementById("feedback-form");
  const statusEl = document.getElementById("feedback-status");
  if (!form) return;

  const nameInput = document.getElementById("sender-name");
  const messageInput = document.getElementById("feedback-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sender_name = nameInput ? nameInput.value.trim() : "";
    const message = messageInput ? messageInput.value.trim() : "";

    if (!message) {
      if (statusEl) {
        statusEl.textContent = "مهرباني وکړئ د نظر متن ولیکئ.";
      }
      return;
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client
          .from("feedback")
          .insert([{ sender_name, message }]);

        if (!error) {
          if (statusEl) {
            statusEl.textContent = "ستاسو نظر په بریالیتوب ولېږل شو.";
          }
          form.reset();
          return;
        }
      } catch (_err) {
        // په لنډمهاله توګه خوندي کېږي
      }
    }

    if (typeof saveFeedbackLocally === "function") {
      saveFeedbackLocally({ sender_name, message });
    }

    if (statusEl) {
      statusEl.textContent = "نظر په لنډمهاله توګه خوندي شو.";
    }
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadPoems();
  initFeedbackForm();
}); 
