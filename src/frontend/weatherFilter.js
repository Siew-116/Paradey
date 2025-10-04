// Variable Filter Widget
document.addEventListener('DOMContentLoaded', () => {
  const weatherButtons = document.querySelectorAll('.weatherBtn');
  const weatherCardsContainer = document.getElementById('weather-cards-top');

  // Default data of weather card
  const weatherData = {
    Temperature: { value: '0°C', analysis: '' },
    Humidity: { value: '0%', analysis: '' },
    Windspeed: { value: '0 km/h', analysis: '' },
    Rainfall: { value: '0%', analysis: '' },
    'Air quality': { value: '-', analysis: '' },
    Snowfall: { value: '0 cm', analysis: '' }
  };

  // Default thresholds (editable via preferences later)
  let thresholds = {
    Temperature: 35,
    Humiditiy: 85,
    Windspeed: 30,
    Rainfall: 70
  };

  // Track active weather variables
  let activeWeather = new Set();

  // Make all buttons active by default on page load
  weatherButtons.forEach(btn => {
    btn.classList.add('active');
    activeWeather.add(btn.textContent.trim());
  });

  // Render default cards
  renderWeatherCards();

  // Add click toggle for each button
  weatherButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const weatherType = btn.textContent.trim();

      if (activeWeather.has(weatherType)) {
        btn.classList.remove('active');
        btn.classList.add('disabled');
        activeWeather.delete(weatherType);
      } else {
        btn.classList.add('active');
        btn.classList.remove('disabled');
        activeWeather.add(weatherType);
      }
      renderWeatherCards();
      if (window.onWeatherChange) window.onWeatherChange(); // notify map.js abt selected variables changed
    });
  });

  // Clear All button logic
  const clearAllBtn = document.getElementById("clearAll-btn");
  clearAllBtn.addEventListener("click", () => {
    weatherButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.classList.add('disabled');
    });
    activeWeather.clear();
    renderWeatherCards();
    if (window.onWeatherChange) window.onWeatherChange();
  });

  // Render weather cards in right panel
  function renderWeatherCards() {
    weatherCardsContainer.innerHTML = ''; // clear old cards

    activeWeather.forEach(type => {
      const data = weatherData[type];
      if (!data) return;

      const card = document.createElement('div');
      card.classList.add('weather-card');
      card.id = `weather-card-${type}`;
      card.innerHTML = `
        <h3>${type}</h3>
        <p>${data.value}</p>
        <p>${data.analysis}</p>
      `;
      weatherCardsContainer.appendChild(card);
    });
  }

  const modal = document.getElementById("preferencesModal");
  const openBtn = document.getElementById("weather-settings-btn");
  const closeBtn = document.getElementById("closePreferences-btn");
  const form = document.getElementById("preferencesForm");

  openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    thresholds.Temperature = parseInt(document.getElementById("temp-threshold").value);
    thresholds.Humiditiy = parseInt(document.getElementById("humidity-threshold").value);
    thresholds.Windspeed = parseInt(document.getElementById("wind-threshold").value);
    thresholds.Rainfall = parseInt(document.getElementById("rain-threshold").value);
    modal.classList.add("hidden");
    renderWeatherCards();

    // Show toast message
    const toast = document.getElementById("toast");
    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.classList.add("hidden"), 300);
    }, 2000); // disappears after 2s
  });

  // Expose selected variables globally for map.js using activeWeather
  window.getSelectedVariables = function () {
    return Array.from(activeWeather);
  };

  // --- Load analysed data
  document.addEventListener("analysisCompleted", (e) => {
      const { pred_values, threshold_desc, units, location, year, travel_tips } = e.detail;
      updateWeatherCards(pred_values, threshold_desc, units); // update weather card  
      updateAlertAndRecomm(location, year, travel_tips);  // update alert and recommendation    
  });

  // --- Update result to weather cards ---
  function updateWeatherCards(predValues, thresholdDesc, units) {
    Object.keys(predValues).forEach(variable => {
        const card = document.getElementById(`weather-card-${variable}`);
        if (!card) return;

        // Predicted value
        let value = predValues[variable];
        if (typeof value === 'number') {
            value = Number.parseFloat(value).toPrecision(3);
        }

        // Units
        let unit = units[variable] || "";

        // Analysis / threshold
        let status = thresholdDesc[variable];  
        let analysis = thresholdDescription(variable, status);

        // Special handling for AirQuality
        if (variable === "Air quality") {
            value = translateAirQuality(thresholdDesc[variable]); // Good/Moderate/Poor
            unit = ""; // no unit for AirQuality
        } else {
            // Append unit
            value = value + (unit ? " " + unit : "");
        }

        // Update the card
        const pTags = card.getElementsByTagName("p");
        if (pTags.length >= 2) {
            pTags[0].textContent = value;       // first <p> → value + unit
            pTags[1].textContent = analysis;    // second <p> → threshold/analysis
            pTags[0].style.color = getThresholdColor(thresholdDesc[variable]);
        }
    });
}

// --- Helper: translate AOD to plain language ---
function translateAirQuality(thresholdDesc) {
    switch(thresholdDesc) {
        case "⚠️ Above Threshold":
            return "Poor";
        case "⚠️ Equal to Threshold":
            return "Moderate";
        case "✅ Below Threshold":
        case "Zero value":
            return "Good";
        default:
            return "-";
    }
}

// --- Helper: Change color based on threshold status ---
function getThresholdColor(desc) {
    switch(desc) {
        case "⚠️ Above Threshold":
            return "red";
        case "⚠️ Equal to Threshold":
            return "orange";
        case "Zero value":
            return "gray";
        case "✅ Below Threshold":
            return "green";
        default:
            return "#555"; // default text color
    }
}

// --- Helper: Hard code plain description about threshold status (generated from CHATGPT) ---
function thresholdDescription(varName, status) {
    switch (varName) {
        case "Temperature":
            if (status === "⚠️ Above Threshold") return "Quite hot, stay hydrated.";
            if (status === "⚠️ Equal to Threshold") return "Comfortably warm.";
            if (status === "Zero value") return "No temperature data available.";
            return "Cool and mild, pleasant weather.";

        case "Humidity":
            if (status === "⚠️ Above Threshold") return "Very humid, might feel sticky.";
            if (status === "⚠️ Equal to Threshold") return "Normal humidity levels.";
            if (status === "Zero value") return "No humidity data available.";
            return "Dry and pleasant air.";

        case "Rainfall":
            if (status === "⚠️ Above Threshold") return "Heavy rain expected, carry an umbrella.";
            if (status === "⚠️ Equal to Threshold") return "Average rainfall, nothing unusual.";
            if (status === "Zero value") return "Clear skies, no rain.";
            return "Light showers in the area.";

        case "Windspeed":
            if (status === "⚠️ Above Threshold") return "Strong winds, take caution outdoors.";
            if (status === "⚠️ Equal to Threshold") return "Steady breeze, typical conditions.";
            if (status === "Zero value") return "No wind detected.";
            return "Gentle breeze, calm atmosphere.";

        case "Air quality":
            if (status === "⚠️ Above Threshold") return "Unhealthy air quality, consider a mask.";
            if (status === "⚠️ Equal to Threshold") return "Moderate air, acceptable for most.";
            if (status === "Zero value") return "No air quality data available.";
            return "Clean and fresh air.";

        case "Snowfall":
            if (status === "⚠️ Above Threshold") return "Heavy snow, travel may be disrupted.";
            if (status === "⚠️ Equal to Threshold") return "Typical snowfall for the season.";
            if (status === "Zero value") return "No snow detected.";
            return "Light snow, minimal impact.";

        default:
            return `${varName}: No information available.`;
    }
}

// --- Hard coded Alerts Explanation (generated by AI) ---
const alertsData = {
  "HK Disneyland": {
    2025: [
      {
        month: "Jan–Feb, Dec",
        desc: "Cooler than usual with slightly below-normal temperature and humidity; Jan snowfall slightly below normal—possible cold snaps and frost patches. Gusty winds may occur in Dec."
      },
      {
        month: "Mar–Apr",
        desc: "Air quality higher than usual, peaking in April; haze and smog episodes likely. Temperatures and humidity generally normal."
      },
      {
        month: "Jun–Aug",
        desc: "Rainfall slightly above normal in Jun & Aug; temperature and humidity slightly above normal in Jul–Aug. Heatwaves possible in Jul–Aug, scattered thunderstorms likely."
      },
      {
        month: "Sep–Nov",
        desc: "Windspeed slightly below normal in Sep, slightly above normal in Oct–Nov. Mild temperatures; risk of gusty winds and occasional storms."
      }
    ],
    2026: [
      {
        month: "Jan–Feb, Dec",
        desc: "Cooler than usual; Jan snowfall much lower than usual. Slightly below-normal humidity; cold snaps and frost possible. Gusty winds likely in Dec."
      },
      {
        month: "Mar–Apr",
        desc: "Air quality higher than usual, peaking in April; haze episodes likely. Temperatures and humidity within normal range."
      },
      {
        month: "Jun–Aug",
        desc: "Rainfall slightly above normal in Jun & Aug; temperature and humidity slightly above normal in Jul–Aug. Heatwaves possible, scattered thunderstorms likely."
      },
      {
        month: "Sep–Nov",
        desc: "Windspeed slightly below normal in Sep, higher than usual in Oct–Nov. Mild temperatures; risk of gusty winds and occasional storms."
      }
    ]
  },

  "Kinabalu": {
    2025: [
      {
        month: "Jan–Feb",
        desc: "Cool, humid; air quality normal. Feb winds slightly gusty. No snowfall."
      },
      {
        month: "Mar–Apr",
        desc: "Mild; Apr slightly warmer. Small chance of localized storms."
      },
      {
        month: "May–Aug",
        desc: "High humidity in May; rainfall above normal Jun–Aug. Risk of thunderstorms, heavy rain, and May heatwave. Winds mild."
      },
      {
        month: "Sep–Nov",
        desc: "Mild; Sep normal rainfall, Oct–Nov slightly above. Occasional gusty winds and scattered storms."
      },
      {
        month: "Dec",
        desc: "Normal conditions; mild winds, no extremes."
      }
    ],
    2026: [
      {
        month: "Jan–Feb",
        desc: "Cool, humid; Feb winds slightly gusty. No snowfall."
      },
      {
        month: "Mar–Apr",
        desc: "Mild; Apr slightly warmer. Chance of localized storms."
      },
      {
        month: "May–Aug",
        desc: "High humidity in May; Aug rainfall slightly above normal. Risk of thunderstorms, heavy rain, and May heatwave."
      },
      {
        month: "Sep–Nov",
        desc: "Mild; Sep air quality slightly below normal. Oct–Nov rainfall slightly above, occasional gusts and scattered storms."
      },
      {
        month: "Dec",
        desc: "Normal conditions; mild winds, no extremes."
      }
    ]
  }
};

// --- Update results to Alerts & Recommendations cards
function updateAlertAndRecomm(location, year, travel_tips) {
  const alertEl = document.querySelector(".alert p");
  const recommEl = document.querySelector(".recommendation p");

  // --- Update alerts ---
  if (alertsData[location] && alertsData[location][year]) {
    const alerts = alertsData[location][year]
      .map(item => {
        return `<div style="margin-bottom:10px; line-height:1.5em;">
                  <strong>${item.month}</strong><br>
                  ${item.desc}
                </div>`;
      })
      .join("");
    alertEl.innerHTML = alerts;
  }

  // --- Update recommendations ---
  if (travel_tips) {
    recommEl.textContent = travel_tips;
  } else {
    recommEl.textContent = "No recommendations available.";
  }
}
});
