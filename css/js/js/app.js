async function loadPoems() {
  const listEl = document.getElementById("poems-list");
  if (!listEl || !supabaseClient) return;

  const { data, error } = await supabaseClient
    .from("poems")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    listEl.innerHTML = "<p>د شعرونو په راوړلو کې ستونزه راغله.</p>";
    return;
  }

  if (!data || data.length === 0) {
    listEl.innerHTML = "<p>تر اوسه شعرونه نشته؛ وروسته به د مدیر له پاڼې ورزیات شي.</p>";
    return;
  }

  listEl.innerHTML = data
    .map(
      (poem) => `
      <article class="poem-card">
        <h3>${poem.title || "بې سرلیکه"}</h3>
        <p>${poem.body || ""}</p>
      </article>
    `
    )
    .join("");
}

async function initFeedbackForm() {
  const form = document.getElementById("feedback-form");
  const statusEl = document.getElementById("feedback-status");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const sender_name = document.getElementById("sender-name").value.trim();
    const message = document.getElementById("feedback-message").value.trim();

    if (supabaseClient) {
      const { error } = await supabaseClient
        .from("feedback")
        .insert([{ sender_name, message }]);

      if (!error) {
        statusEl.textContent = "ستاسو نظر په بریالیتوب ولېږل شو.";
        form.reset();
        return;
      }
    }

    saveFeedbackLocally({ sender_name, message });
    statusEl.textContent = "نظر په لنډمهاله توګه خوندي شو.";
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadPoems();
  initFeedbackForm();
}); 
