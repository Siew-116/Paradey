// === Comfort Index Scoring System ===

document.addEventListener("DOMContentLoaded", () => {
  // Calculate comfort index score
  function calculateComfortIndex(predValues, historical) {
  if (!predValues || !historical) return null;

  let score = 100; // Start at max comfort

  for (const variable in predValues) {
    const pred = predValues[variable];
    let history = historical[variable];

    if (!history || history.length === 0) continue;

    // Extract only "value" from each object
    const numericHistory = history.map(d => d.value).filter(v => !isNaN(v));

    if (numericHistory.length === 0) continue;

    // Mean & Std
    const mean =
      numericHistory.reduce((a, b) => a + b, 0) / numericHistory.length;
    const variance =
      numericHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
      numericHistory.length;
    const std = Math.sqrt(variance);

    // Penalize based on deviation
    if (pred > mean + std) {
      score -= 10;
      if (pred > mean + 2 * std) score -= 15;
    } else if (pred < mean - std) {
      score -= 10;
      if (pred < mean - 2 * std) score -= 15;
    }
  }

  return Math.max(0, Math.min(score, 100)); // Clamp [0–100]
}

  // Update UI comfort bar
  function updateComfortIndex(score) {
    const container = document.getElementById("comfortIndex");
    const fill = document.getElementById("fill");
    if (!container || !fill) {
      return;
    }

    if (score === null) {
      container.classList.remove("active");
      fill.style.width = "100%";
      fill.style.background = "#9e9e9e";
      fill.textContent = "";
      return;
    }

    container.classList.add("active");

    const safeScore = Math.max(0, Math.min(score, 100));
    fill.style.width = safeScore + "%";
    fill.textContent = Math.round(safeScore) + "%";

    // Colors
    if (safeScore >= 70) {
      fill.style.background =
        "linear-gradient(90deg, #388e3c, #4caf50)";
    } else if (safeScore >= 40) {
      fill.style.background =
        "linear-gradient(90deg, #ffb300, #ff9800)";
    } else {
      fill.style.background =
        "linear-gradient(90deg, #0b3d91, #105bd8)";
    }
  }

  // Listen for data load event
  document.addEventListener("analysisCompleted", (e) => {
    console.group("[ComfortIndex] Event Triggered: analysisCompleted");
    const predValues = e.detail.pred_values;
    const historical = e.detail.historical_10y;
    const score = calculateComfortIndex(predValues, historical);
    updateComfortIndex(score);
    console.groupEnd();
  });

  // Export helpers for manual testing
  window.calculateComfortIndex = calculateComfortIndex;
  window.updateComfortIndex = updateComfortIndex;
});
