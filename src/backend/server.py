# server.py
# Flask backend server
from flask import Flask, request, jsonify
import json
import os
from flask_cors import CORS

# Initialise Flask App
app = Flask(__name__)
CORS(app, supports_credentials=True)

# RESULT FILE PATH
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # folder where server.py lives
CACHE_FILE = os.path.join(BASE_DIR, "..", "..", "result", "full_analysed_cache.json") # redirect to full result file

if not os.path.exists(CACHE_FILE):
    raise FileNotFoundError(f"Cache file not found: {CACHE_FILE}")

with open(CACHE_FILE, "r", encoding="utf-8") as f:
    FULL_CACHE = json.load(f)

# Routing settings
@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        lat = data.get("lat")
        lon = data.get("lon")
        year = str(data.get("year"))
        month = data.get("month")
        variables = data.get("variables", [])

        if not (lat and lon and year and month and variables):
            return jsonify({"error": "Missing required fields"}), 400

        VAR_KEY_MAP = {
            "Temperature": "Temperature",
            "Humiditiy": "Humidity",       
            "Windspeed": "Windspeed",
            "Rainfall": "Rainfall",
            "Air quality": "AirQuality",
            "Snowfall": "Snowfall"
        }

        # Find closest location
        best_loc = None
        min_dist = float("inf")
        for loc_name, loc_data in FULL_CACHE.items():
            first_var = next(iter(loc_data.values()))
            loc_lat = first_var.get("lat")
            loc_lon = first_var.get("lon")
            if loc_lat is None or loc_lon is None:
                continue
            dist = (lat - loc_lat)**2 + (lon - loc_lon)**2
            if dist < min_dist:
                min_dist = dist
                best_loc = loc_name

        if not best_loc:
            return jsonify({"error": "No matching location in cache"}), 404

        loc_data = FULL_CACHE[best_loc]

        # Prepare response dictionaries
        pred_values = {}
        threshold_desc = {}
        units = {}
        anomalies = {}
        seasonal_trends = {}
        historical_10y = {}

        print(f"Request variables: {variables}")

        # Fetch per-variable data
        for var in variables:
            key = VAR_KEY_MAP.get(var, var)
            var_data = loc_data.get(key, {})

            pred_val = var_data.get("pred_values", {}).get(year, {}).get(month, "N/A")
            threshold = var_data.get("threshold_statuses", {}).get(year, {}).get(month, "No data")
            anomaly = var_data.get("anomalies", {}).get(year, "No data")
            seasonal = var_data.get("seasonal_trends", {})
            historical = var_data.get("historical_10y", [])

            pred_values[var] = pred_val
            threshold_desc[var] = threshold
            units[var] = var_data.get("unit", "")
            anomalies[var] = anomaly
            seasonal_trends[var] = seasonal
            historical_10y[var] = historical

            print(f"🔹 {var}: pred={pred_val}, threshold={threshold}, anomaly={anomaly}, seasonal={seasonal}, historical_len={len(historical)}")

        # Travel tips (year + month, NOT variable-specific)
        travel_tips_val = loc_data.get("TravelTips", {}).get(year, {}).get(month, "No data")
        print(f"Travel tips: {travel_tips_val}")

        response = {
            "location": best_loc,
            "year": year,
            "month": month,
            "variables": variables,
            "units": units,
            "pred_values": pred_values,
            "threshold_desc": threshold_desc,
            "anomalies": anomalies,
            "seasonal_trends": seasonal_trends,
            "historical_10y": historical_10y,
            "travel_tips": travel_tips_val
        }

        print("Response ready")
        return jsonify(response)

    except Exception as e:
        print("Exception:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
