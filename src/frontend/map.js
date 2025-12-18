// Interactive map widget with location and date prompt
document.addEventListener('DOMContentLoaded', () => {
  // --- Map initialization ---
  const map = L.map('map').setView([3.139, 101.6869], 13); // KL
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  let marker;
  let selectedLat = null;
  let selectedLon = null;

  const applyBtn = document.getElementById("applyBtn");
  const dateInput = document.getElementById("selected-month");

  // --- Last applied payload to detect changes ---
  let lastPayload = null;

  // --- Show error popup ---
  function showError(message) {
    const popup = document.getElementById("error-popup");
    const msg = document.getElementById("error-message");
    msg.textContent = message;
    popup.style.display = "flex";
  }

  document.getElementById("close-popup").addEventListener("click", () => {
    document.getElementById("error-popup").style.display = "none";
  });

  // --- Get current selected weather variables ---
  function getSelectedVariables() {
    return Array.from(document.querySelectorAll(".weatherBtn.active"))
      .map(btn => btn.textContent.trim());
  }

  // --- Construct current payload ---
  function getCurrentPayload() {
    if (!dateInput.value) return null;
    const [year, monthNum] = dateInput.value.split("-");
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = monthNames[parseInt(monthNum) - 1];

    return {
      lat: selectedLat,
      lon: selectedLon,
      year,
      month,
      variables: getSelectedVariables()
    };
  }

  // --- Update Apply button visual state ---
  function updateApplyState() {
    const payload = getCurrentPayload();
    const valid = selectedLat && selectedLon && dateInput.value && getSelectedVariables().length;
    const changed = payload && JSON.stringify(payload) !== JSON.stringify(lastPayload);

    if (!valid || !changed) {
      applyBtn.classList.add("inactive-btn"); // greyed out
    } else {
      applyBtn.classList.remove("inactive-btn"); // active
    }
  }

  // --- Place marker on map ---
  function placeMarker(lat, lng, name = "Unknown") {
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map)
      .bindPopup(`<b>${name}</b><br>Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}`)
      .openPopup();
    map.setView([lat, lng], 15);
    selectedLat = lat;
    selectedLon = lng;
    /// --- Update prompt text ---
  const shortName = name.split(",")[0];
  const title = document.getElementById("location-title");
  const coords = document.getElementById("coords");
  title.textContent = shortName;
  coords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  // --- Change colors directly ---
  title.style.color = " #0b3d91";        // h3 text color
  coords.style.color = " #315594ff";       // p text color
  
  updateApplyState();
  }

  map.on("click", async (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    let placeName = "Unknown";

    try {
      // Fetch from Leaflet
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.display_name) placeName = data.display_name;
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
    placeMarker(lat, lng, placeName);
  });

  // --- Search functionality ---
  const searchContainer = document.getElementById("search-container");
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");
  const resultsPanel = document.getElementById("results-panel");
  searchContainer.addEventListener("click", (e) => e.stopPropagation());

  searchBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const query = searchInput.value.trim();
    if (!query) return showError("Please enter a location name or coordinates");

    resultsPanel.innerHTML = "";
    if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(query)) {
      const [lat, lng] = query.split(",").map(Number);
      placeMarker(lat, lng, "Custom Location");
    } else {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!data.length) return showError("Location not found");

        data.forEach(item => {
          const li = document.createElement("li");
          li.textContent = item.display_name;
          li.addEventListener("click", (e) => {
            e.stopPropagation();
            placeMarker(parseFloat(item.lat), parseFloat(item.lon), item.display_name);
            resultsPanel.innerHTML = "";
          });
          resultsPanel.appendChild(li);
        });
      } catch (err) {
        console.error(err);
        return showError("Search failed");
      }
    }
  });

  // --- Date picker ---
  const datePickerContainer = document.getElementById("date-picker-container");
  if (datePickerContainer) L.DomEvent.disableClickPropagation(datePickerContainer);
  dateInput.addEventListener("input", () => {
  const [year, monthNum] = dateInput.value.split("-");
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = monthNames[parseInt(monthNum)-1];
  
  document.getElementById("month").textContent = month; // update button
  document.getElementById("year").textContent = year;   // update button
  
  const monthBtn = document.getElementById("month");
  const yearBtn = document.getElementById("year");
  monthBtn.style.color = "#fff";     // button text color
  monthBtn.style.backgroundColor = " #1b4998ff";  // button bg
  yearBtn.style.color = "#fff";
  yearBtn.style.backgroundColor = " #4a79caff";
  updateApplyState();
});

  // --- Weather buttons ---
  document.querySelectorAll(".weatherBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      updateApplyState();
    });
  });

  // --- Apply button ---
  applyBtn.addEventListener("click", async () => {
    const payload = getCurrentPayload();
    const valid = selectedLat && selectedLon && dateInput.value && getSelectedVariables().length;
    const changed = payload && JSON.stringify(payload) !== JSON.stringify(lastPayload);

    if (!valid) {
      showError("Please fill in all required fields before applying.");
      return;
    } 
    if (!changed) {
      showError("No changes detected. Modify inputs to apply.");
      return;
    }

    applyBtn.classList.add("inactive-btn"); // grey while sending

    try {
      const res = await fetch("https://paradey.onrender.com/analyze", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        showError(`Server error: ${res.status}`);
        return updateApplyState();
      }

      const data = await res.json();
      document.dispatchEvent(new CustomEvent("analysisCompleted", { detail: data }));
      lastPayload = payload; // save applied payload
      updateApplyState();
    } catch (err) {
      showError("Failed to connect to backend.");
      updateApplyState();
    }
  });

  // --- Initialize Apply button visual ---
  updateApplyState();

  // --- Expose selected variables for map.js ---
  window.getSelectedVariables = getSelectedVariables;
});
