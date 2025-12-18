# -*- coding: utf-8 -*-
"""
Paradey Climate Analysis
-----------------------------
Data source: MERRA-2 product (via NASA OPenDAP)
Subset locations: Mount Kinabalu & Hong Kong Disneyland
Temporal: monthly data from 2015 to 2025
Variables: Air Quality, Humidity, Rainfall, Snowfall, Temperature, Windspeed
- Pre-generate prediction and trend analysis for 2025 and 2026, based on past 10 years data for demo purposes
- Includes threshold status, historical stats, anomalies, seasonal patterns
"""

import os
import xarray as xr
import numpy as np
import pandas as pd
import json
from datetime import datetime

# === SETTINGS ===
years = list(range(2015, 2025))
months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

# === VARIABLES CONFIG ===
VARIABLES = {
    "AirQuality": {"file_prefix":"M2TMNXAER", "vars":["TOTEXTTAU"], "unit":"AOD", "threshold": 0.25},
    "Rainfall": {"file_prefix":"M2TMNXFLX", "vars":["PRECCON"], "unit":"mm/day", "threshold": 5},
    "Snowfall": {"file_prefix":"M2TMNXFLX", "vars":["PRECSNO"], "unit":"cm/day", "threshold": 5},
    "Humidity": {"file_prefix":"M2TMNXSLV", "vars":["QV2M"], "unit":"%", "threshold": 75},
    "Temperature": {"file_prefix":"M2TMNXSLV", "vars":["T2M"], "unit":"°C", "threshold": 30},
    "Windspeed": {"file_prefix":"M2TMNXSLV", "vars":["U10M","V10M"], "unit":"km/h", "threshold": 50}
}

# === DATASET FILE PATH ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR,"..",  "..", "dataset")

# === LOCATIONS ===
# Note: Only ONE location is allowed at a time.
# To switch location, comment out the current one and uncomment another.
LOCATIONS = {
   "Kinabalu": {"lat":6.074, "lon":116.558, "folder": os.path.join(DATASET_DIR,"merra2_kinabalu_data")},
  #"HKDisneyland": {"lat":22.314, "lon":114.041, "folder": os.path.join(DATASET_DIR,"merra2_hkdisneyland_data")}
}

# === HELPER FUNCTIONS ===
def safe_float(x):
    try: return float(x.item() if hasattr(x, "item") else x)
    except: return 0.0

# Anomaly
def anomaly_flag(val, mean, std):
    if val > mean + 2*std: return "⚠️ Anomalously High"
    if val < mean - 2*std: return "⚠️ Anomalously Low"
    if val <= 0: return "Zero value"
    return "✅ Within Normal Range"

# translate anomaly flag
def translate_value(val, mean, std):
    if val > mean + 2*std: return "⚠️ Much higher than usual"
    elif val > mean + std: return "↑ Slightly above normal"
    elif val < mean - 2*std: return "⚠️ Much lower than usual"
    elif val < mean - std: return "↓ Slightly below normal"
    elif val <= 0: return "Zero value"
    else: return "✅ Within normal range"

# Threshold status
def projection_status(val, threshold):
    if val > threshold:
        return "⚠️ Above Threshold"
    elif val == threshold:
        return "⚠️ Equal to Threshold"
    elif val <= 0:
        return "Zero value"
    else:
        return "✅ Below Threshold"
    
# === LOAD VARIABLE DATA WITH MASKING & UNIT CONVERSION ===
def load_variable(prefix, var_list, folder, var_name):
    all_data = {}
    for year in years:
        year_folder = os.path.join(folder, str(year))
        if not os.path.exists(year_folder): 
            continue
        files = sorted([f for f in os.listdir(year_folder) if prefix in f])
        monthly_vals = []
        for file in files:
            try:
                ds = xr.open_dataset(os.path.join(year_folder, file))

                # --- Windspeed (U10M + V10M) ---
                if set(["U10M","V10M"]).issubset(var_list):
                    if "U10M" in ds and "V10M" in ds:
                        U = ds["U10M"]
                        V = ds["V10M"]
                        # Mask invalid values
                        U = U.where((U != getattr(U, "_FillValue", 1e20)) & 
                                    (U != getattr(U, "missing_value", 1e20)))
                        V = V.where((V != getattr(V, "_FillValue", 1e20)) & 
                                    (V != getattr(V, "missing_value", 1e20)))
                        Umean = U.mean(dim="time") if "time" in U.dims else U
                        Vmean = V.mean(dim="time") if "time" in V.dims else V
                        val = safe_float(np.sqrt(Umean**2 + Vmean**2))
                        val = val * 3.6  # m/s -> km/h
                    else:
                        val = 0.0

                else:
                    vals = []
                    for var in var_list:
                        if var in ds:
                            v = ds[var]
                            # Mask invalid values
                            fill_val = getattr(v, "_FillValue", None)
                            missing_val = getattr(v, "missing_value", None)
                            if fill_val is not None:
                                v = v.where(v != fill_val)
                            if missing_val is not None:
                                v = v.where(v != missing_val)
                            vmean = v.mean(dim="time") if "time" in v.dims else v
                            vals.append(vmean)
                        else:
                            vals.append(0.0)
                    val = np.mean([safe_float(v) for v in vals])

                    # --- Unit conversion ---
                    if var_name == "Rainfall":
                        val = val * 86400  # kg/m²/s -> mm/day
                    elif var_name == "Snowfall":
                        val = val * 86400 * 100  # kg/m²/s -> cm/day
                    elif var_name == "Temperature":
                        val = val - 273.15  # K -> °C
                    elif var_name == "Humidity":
                        # Convert specific humidity + temperature -> RH%
                        if "T2M" in ds:
                            T = ds["T2M"]
                            fill_val = getattr(T, "_FillValue", None)
                            missing_val = getattr(T, "missing_value", None)
                            if fill_val is not None:
                                T = T.where(T != fill_val)
                            if missing_val is not None:
                                T = T.where(T != missing_val)
                            Tmean = T.mean(dim="time") if "time" in T.dims else T
                            T_C = safe_float(Tmean) - 273.15  # K -> °C

                            # Tetens formula
                            q = val  # specific humidity (kg/kg)
                            P = 1013.25  # hPa (assume surface pressure)
                            e = (q * P) / (0.622 + 0.378 * q)  # hPa
                            es = 6.112 * np.exp((17.67 * T_C) / (T_C + 243.5))  # hPa
                            val = 100 * e / es  # RH%
                        else:
                            val = val * 100  # fallback
                    # AirQuality (AOD) → no conversion
                monthly_vals.append(val)
            except:
                monthly_vals.append(0.0)

        if len(monthly_vals) == 12:
            all_data[year] = monthly_vals

    return all_data


# === COMPUTE REPORT WITH FULL METADATA ===
def compute_report(var_name, info, folder):
    all_data = load_variable(info["file_prefix"], info["vars"], folder, var_name)
    if not all_data: return {}
    
    all_months = [v for year_vals in all_data.values() for v in year_vals]
    mean_val = np.mean(all_months)
    std_val = np.std(all_months)
    years_num = np.array(list(all_data.keys()))
    annual_avg = np.array([np.mean(vals) for vals in all_data.values()])

    # Seasonal trends
    df = pd.DataFrame(all_data).T
    monthly_mean = df.mean(axis=0)
    seasonal_labels = {}
    for i, m in enumerate(months):
        if monthly_mean[i] > mean_val + std_val:
            label = "☁️ Usually high"
        elif monthly_mean[i] < mean_val - std_val:
            label = "🌤 Usually low"
        else:
            label = "😐 Normal range"
        seasonal_labels[m] = label

    # --- Annual anomaly/summary for 2025 and 2026 ---
    forecast_years = [2025, 2026]
    forecast_annual = {
        year: safe_float(np.poly1d(np.polyfit(years_num, annual_avg, 1))(year))
        for year in forecast_years
    }
    
    forecast_flag = {year: anomaly_flag(val, mean_val, std_val)
                      for year, val in forecast_annual.items()}
   
    # Pre-generate monthly forecasts 2025 to 2026
    forecast_cache = []
    for year in range(2025, 2027):
        for month_idx, month_name in enumerate(months):
            month_vals = [vals[month_idx] for vals in all_data.values()]
            coef_m = np.polyfit(years_num, month_vals, 1)
            trend_m = np.poly1d(coef_m)
            forecast_val = safe_float(trend_m(year))
            forecast_cache.append({
                "year": year,
                "month": month_name,
                "value": forecast_val,
                "threshold_status": projection_status(forecast_val, info.get("threshold", np.inf)),
                "anomaly": translate_value(forecast_val, mean_val, std_val),
                "seasonal_trend": seasonal_labels[month_name]
            })

    return {
    "unit": info["unit"],
    "historical_10y": [{"year": int(y), "value": safe_float(annual_avg[i])} 
                       for i,y in enumerate(years_num)],
    "mean": mean_val,
    "std": std_val,
    "monthly_forecast_cache": forecast_cache,
    "anomaly": forecast_flag,
    "seasonal_trends": seasonal_labels,
    "lat": lat,
    "lon": lon
}

# === BUILD FULL CACHE FOR ALL LOCATIONS & VARIABLES ===
full_cache = {}
for loc_name, loc_info in LOCATIONS.items():
    folder = loc_info["folder"]
    lat = loc_info["lat"]
    lon = loc_info["lon"]
    print(f"\nBuilding cache for {loc_name}...")
    full_cache[loc_name] = {}
    for vname, vinfo in VARIABLES.items():
        print(f"  Processing {vname}...")
        full_cache[loc_name][vname] = compute_report(vname, vinfo, folder)
        # Add lat/lon to top-level
        full_cache[loc_name][vname]["lat"] = lat
        full_cache[loc_name][vname]["lon"] = lon

# === SAVE CACHE TO JSON ===
output_path = "pred_cache_mkinabalu.json"   # Notes: change based on needs

formatted_cache = {}
for loc, vars_dict in full_cache.items():
    formatted_cache[loc] = {}
    for var, details in vars_dict.items():
        # Reshape monthly_forecast_cache into grouped dicts
        pred_values = {}
        threshold_statuses = {}
        anomalies = {}
        for entry in details["monthly_forecast_cache"]:
            year = str(entry["year"])
            month = entry["month"]
            if year not in pred_values:
                pred_values[year] = {}
                threshold_statuses[year] = {}
                anomalies[year] = {}
            pred_values[year][month] = entry["value"]
            threshold_statuses[year][month] = entry["threshold_status"]
            anomalies[year][month] = entry["anomaly"]

        formatted_cache[loc][var] = {
            "unit": details["unit"],
            "lat": details["lat"],
            "lon": details["lon"],
            "historical_10y": details["historical_10y"],
            "mean": details["mean"],
            "std": details["std"],
            "pred_values": pred_values,
            "threshold_statuses": threshold_statuses,
            "anomalies": anomalies,
            "seasonal_trends": details["seasonal_trends"]
        }

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(formatted_cache, f, indent=2, ensure_ascii=False)

print(f"\nCache saved in LATEST format: {output_path}")
