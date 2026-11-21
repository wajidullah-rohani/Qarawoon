const LOCAL_FEEDBACK_KEY = "qarawoon_pending_feedback";

function saveFeedbackLocally(entry) {
  const existing = JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || "[]");
  existing.push({ ...entry, created_at: new Date().toISOString() });
  localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(existing));
}

function getLocalFeedback() {
  return JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || "[]");
}

function clearLocalFeedback() {
  localStorage.removeItem(LOCAL_FEEDBACK_KEY);
} 
