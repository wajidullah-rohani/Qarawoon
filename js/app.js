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
