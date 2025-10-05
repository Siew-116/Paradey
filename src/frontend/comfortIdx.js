// === Comfort Index Scoring System (Updated for New UI) ===
document.addEventListener("DOMContentLoaded", () => {

  // 🧮 Calculate comfort index
  function calculateComfortIndex(predValues, historical) {
    if (!predValues || !historical) return null;

    let score = 100;

    for (const variable in predValues) {
      const pred = predValues[variable];
      const history = historical[variable];
      if (!history || history.length === 0) continue;

      const numericHistory = history.map(d => d.value).filter(v => !isNaN(v));
      if (numericHistory.length === 0) continue;

      const mean = numericHistory.reduce((a, b) => a + b, 0) / numericHistory.length;
      const variance = numericHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericHistory.length;
      const std = Math.sqrt(variance);

      if (pred > mean + std) {
        score -= 10;
        if (pred > mean + 2 * std) score -= 15;
      } else if (pred < mean - std) {
        score -= 10;
        if (pred < mean - 2 * std) score -= 15;
      }
    }

    return Math.max(0, Math.min(score, 100));
  }

  // 🎨 Update Comfort Index UI
  function updateComfortIndex(score) {
    const scoreEl = document.getElementById("comfortScore");
    const progressFill = document.getElementById("progressFill");
    const stars = document.querySelectorAll(".star");

    if (score === null) {
      if (scoreEl) scoreEl.textContent = "0";
      if (progressFill) progressFill.style.width = "0%";
      stars.forEach(star => star.classList.remove("active"));
      return;
    }

    const safeScore = Math.max(0, Math.min(score, 100));
    const roundedScore = Math.round(safeScore);

    // 🔵 Update number
    if (scoreEl) scoreEl.textContent = roundedScore;

    // 🟩 Update progress bar
    if (progressFill) {
      progressFill.style.width = `${safeScore}%`;

      if (safeScore >= 70) {
        progressFill.style.background = "linear-gradient(90deg, #6dd5ed, #2193b0)";
      } else if (safeScore >= 40) {
        progressFill.style.background = "linear-gradient(90deg, #ffb347, #ffcc33)";
      } else {
        progressFill.style.background = "linear-gradient(90deg, #ff416c, #ff4b2b)";
      }
    }

    // 🌟 Star logic (3 stars)
    stars.forEach((star, i) => {
      if (safeScore >= (i + 1) * 33.3) {
        star.classList.add("active");
      } else {
        star.classList.remove("active");
      }
    });
  }

  // 📡 Listen for event when analysis done
  document.addEventListener("analysisCompleted", (e) => {
    console.group("[ComfortIndex] analysisCompleted Triggered");
    const predValues = e.detail.pred_values;
    const historical = e.detail.historical_10y;
    const score = calculateComfortIndex(predValues, historical);
    updateComfortIndex(score);
    const currentLoc = e.detail.location;
    const locationLabel = document.getElementsByClassName("current-loc")[0];
    if (locationLabel) {
      locationLabel.textContent = `${currentLoc}`;
    }
    console.groupEnd();
  });

  // 🧪 Export helpers for manual testing
  window.calculateComfortIndex = calculateComfortIndex;
  window.updateComfortIndex = updateComfortIndex;
});
