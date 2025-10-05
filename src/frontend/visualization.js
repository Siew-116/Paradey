// Charts & Visualisation for Analysis Result

document.addEventListener("DOMContentLoaded", () => {

  let chartsData = []; // store chart configs temporarily

  // Utility to reset container
  function resetContainer(container) {
    container.innerHTML = `<div class="chart-placeholder-text"></div>`;
  }

  // ### Build Line Graph for Decade Trends ###
  function buildLineGraph(variable, detail) {
    const histArray = detail.historical_10y[variable] || [];
    const years = histArray.map(d => d.year);
    const historical = histArray.map(d => Number(d.value.toFixed(2)));
    const prediction = Array(histArray.length).fill(null);
    // Append prediction year if it's not already in years[]
    const predYear = parseInt(detail.year);  // make sure it's a number, e.g. 2025
    prediction.push(Number(detail.pred_values[variable].toFixed(2)));
    years.push(predYear);

    // Graph Layout
    return {
      chart: {
        type: 'line',
        height: 200,
        width: 400,
        toolbar: { show: true },
        zoom: { enabled: false }
      },
      series: [
        { name: 'Historical', data: historical },
        { name: 'Prediction', data: prediction, color: 'red' }
      ],
      xaxis: {
        categories: years,
        title: { text: 'Year', style: { fontSize: '8px' } },
        labels: { rotate: -45, style: { fontSize: '8px' } }
      },
      yaxis: { 
        title: { text: 'Value', style: { fontSize: '8px' } },
        labels: { formatter: val => val.toFixed(2), style: { fontSize: '8px' } }
      },
      stroke: { curve: 'smooth', width: 2 },
      markers: { size: [2, 4], colors: ['#105bd8', 'red'] },
      tooltip: {
        shared: false,   // only show hovered series
        intersect: true, // highlight only one point
        y: {
          formatter: val => val !== null ? val.toFixed(2) : ''
        }
      },
      legend: { position: 'top', fontSize: '8px'},
      title: {
        text: `${variable} (${detail.units[variable] || ""})`,
        align: 'center',
        style: { fontSize: '8px', fontWeight: 'bold', color: '#333' }
      },
      grid: {
        show: true,
        borderColor: '#e0e0e0',
        strokeDashArray: 4
      }
    };
  }

  // ### Render Decade Trend charts ###
  function renderDecadeTrend(detail) {
    const chartContainer = document.querySelector(".decade-chart");
    resetContainer(chartContainer);
    chartsData = [];

    detail.variables.forEach((variable, idx) => {
      const chartDiv = document.createElement("div");
      chartDiv.id = `apex-chart-${idx}`;
      chartDiv.style.height = "200px";  
      chartDiv.style.border = "1px solid #ddd"; 
      chartDiv.style.borderRadius = "8px";
      chartDiv.style.padding = "4px";
      chartDiv.style.background = "#fff";
      chartContainer.appendChild(chartDiv);

      const chartConfig = buildLineGraph(variable, detail);

      // destroy old chart instance if exists
      if (ApexCharts.exec) {
        try { ApexCharts.exec(`apex-chart-${idx}`, "destroy"); } catch (e) {}
      }

      const chart = new ApexCharts(chartDiv, chartConfig);
      chart.render();
    });
  }


  // ### Build Heatmap for Seasonal Pattern ###
  function buildHeatMap(variable, detail) {
    const anomalyData = detail.anomalies[variable] || {};

    // Define chronological month order
    const monthOrder = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Sort the anomalyData keys by month order
    const months = Object.keys(anomalyData).sort(
      (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );

    // Map statuses to numeric codes
    const statusMap = {
      "⚠️ Much higher than usual": 5,
      "↑ Slightly above normal": 4,
      "✅ Within normal range": 3,
      "↓ Slightly below normal": 2,
      "⚠️ Much lower than usual": 1,
      "Zero value": 0
    };

    const data = months.map(m => {
      const status = anomalyData[m] || "";
      const val = Object.entries(statusMap).find(([k]) => status.includes(k));
      return { x: m, y: 1, value: val ? val[1] : -1, status }; // keep status for tooltip
    });

    return {
      chart: {
        type: "heatmap",
        height: 140,
        width: 400,
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0,
          colorScale: {
            ranges: [
              { from: 5, to: 5, color: "#b71c1c", name: "⚠️ Much higher" },   // deep red
              { from: 4, to: 4, color: "#f57c00", name: "↑ Slightly above" }, // orange
              { from: 3, to: 3, color: "#43a047", name: "✅ Normal" },        // strong green
              { from: 2, to: 2, color: "#c0ca33", name: "↓ Slightly below" }, // lime yellow-green
              { from: 1, to: 1, color: "#fdd835", name: "⚠️ Much lower" },   // amber/yellow
              { from: 0, to: 0, color: "#3c3b3bff", name: "Zero value" }      // gray
            ]
          }
        }
      },
      dataLabels: { enabled: false },
      series: [
        {
          name: variable,
          data: data.map(d => ({ x: d.x, y: d.value }))
        }
      ],
      xaxis: {
        title: { text: "Month", style: { fontSize: "8px" } },
        labels: { rotate: -45, style: { fontSize: "8px" } }
      },
      yaxis: {
        labels: { show: false },
        title: { text: "", style: { fontSize: "8px" } }
      },
      grid: {
        show: true,
        borderColor: "#e0e0e0",
        strokeDashArray: 4
      },
      title: {
        text: `Anomaly ${detail.year} - ${variable}`,
        align: "center",
        style: { fontSize: "8px", fontWeight: "bold", color: "#333" }
      },
      tooltip: {
        y: {
          formatter: (val, { dataPointIndex }) => {
            const d = data[dataPointIndex];
            return d.status;

          }
        }
      }
    };
  }

  // ### Render Anomaly charts ###
  function renderAnomaly(detail) {
    const chartContainer = document.querySelector(".anomaly-chart");
    resetContainer(chartContainer);
    detail.variables.forEach((variable, idx) => {
      const chartDiv = document.createElement("div");
      chartDiv.id = `traffic-light-${idx}`;
      chartDiv.style.height = "200px";
      chartDiv.style.border = "1px solid #ddd";
      chartDiv.style.borderRadius = "8px";
      chartDiv.style.padding = "4px";
      chartDiv.style.background = "#fff";
      chartContainer.appendChild(chartDiv);

      const chartConfig = buildHeatMap(variable, detail);
      const chart = new ApexCharts(chartDiv, chartConfig);
      chart.render();
    });
  }


  // ### Build and render Seasonal Pattern Tables ###
  function renderSeasonalPattern(detail) {
    const chartContainer = document.querySelector(".season-chart");
    resetContainer(chartContainer);

    const monthOrder = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const trends = detail.seasonal_trends || {};

    // Clean + color mapping
    const getLabelAndColor = (val) => {
      if (!val) return { label: "", color: "#333" };
      if (val.includes("Usually high")) return { label: "Usually high", color: "red" };
      if (val.includes("Usually low")) return { label: "Usually low", color: "blue" };
      if (val.includes("Normal")) return { label: "Normal", color: "#555" };
      return { label: val, color: "#333" };
    };

    Object.entries(trends).forEach(([variable, months]) => {
      // Wrapper for each variable
      const wrapper = document.createElement("div");
      wrapper.style.marginBottom = "16px";
      wrapper.style.background = "#fff";
      wrapper.style.border = "1px solid #ddd";
      wrapper.style.borderRadius = "8px";
      wrapper.style.padding = "8px";
      wrapper.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";

      // Variable title
      const title = document.createElement("h4");
      title.textContent = `${variable}`;
      title.style.margin = "4px 0 8px 0";
      title.style.fontSize = "12px";
      title.style.fontWeight = "bold";
      title.style.color = "#333";
      title.style.textAlign = "center";
      wrapper.appendChild(title);

      // Table element
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.fontSize = "11px";

      // Table header
      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr style="background:#f5f5f5; text-align:left;">
          <th style="padding:4px 6px; border-bottom:1px solid #ddd;">Month</th>
          <th style="padding:4px 6px; border-bottom:1px solid #ddd;">Trend</th>
        </tr>
      `;
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement("tbody");

      monthOrder.forEach(m => {
        if (months[m]) {
          const { label, color } = getLabelAndColor(months[m]);
          const row = document.createElement("tr");
          row.innerHTML = `
            <td style="padding:4px 6px; border-bottom:1px solid #eee;">${m}</td>
            <td style="padding:4px 6px; border-bottom:1px solid #eee; color:${color}; font-weight:500;">
              ${label}
            </td>
          `;
          tbody.appendChild(row);
        }
      });

      table.appendChild(tbody);
      wrapper.appendChild(table);
      chartContainer.appendChild(wrapper);
    });
  }

  // === Listen for event details ===
  document.addEventListener("analysisCompleted", (e) => {
    const detail = e.detail;
    
      renderDecadeTrend(detail);
      renderSeasonalPattern(detail);
      renderAnomaly(detail);
    });
    
  });
