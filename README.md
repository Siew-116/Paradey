# Paradey – Climate & Weather Analytics Dashboard
Paradey is a web-based climate and weather analytics platform that visualizes trends, highlights potential alerts, and provides alternative recommendations for better environmental decision-making. It integrates interactive maps, charts, and AI-assisted insights for an intuitive user experience.
[Picth Video](https://youtu.be/ouacESCvwhc?si=OEjCIYsBpNxz-fHy)

## Live Demo Link
Try the live frontend here: [Paradey Demo](https://paradey.netlify.app/)

## Tech Stack
- **Frontend:** HTML + CSS + JavaScript  
- **Backend:** Python + Flask  
- **Database:** Local file-based storage (JSON)  
- **Interactive Map:** Leaflet.js  
- **Visualizations & Charts:** ApexCharts.js  
- **Icons:** Google Fonts  

## Features
- Interactive map for selecting location and date  
- Dynamic trend and variable visualization  
- Searchable location and reverse geocoding  
- Alerts and recommendations based on climate data  
- Climate comfort score based on your choice

## HOW TO USE
### 1. Backend (Python + Flask)
> **Requirements:**  
> - Python ≥ 3.9  
> - Flask  
> - Gunicorn (for deployment)  
> - Required Python packages in `requirements.txt`

### Clone repo
```bash
git clone https://github.com/Siew-116/Paradey
cd Paradey/src/backend
```

### Install dependencies
```bash
pip install -r ../requirements.txt
```

### Run locally
```bash
python server.py
```

Or, for production-like testing with Gunicorn:
```bash
gunicorn server:app
```

### 2. Frontend
Navigate to your frontend folder (if separate):
```bash
cd Paradey/frontend
```
- Open index.html in a browser for static testing, or
- Deploy on Netlify (drag & drop the folder, index.html as entry point)

## Limitations
- **Prototype Mode:** The backend uses local JSON files for storage, so user data **will not persist** between server restarts on Render.  
- **Data Scope:** Only **2 pre-downloaded datasets** are used (Hong Kong Disneyland and Mount Kinabalu, 2025–2026). Full NASA OpenDAP data is **not used** due to size and latency.  
- **No Authentication:** The app does not support user accounts or secure login.  

### Future Extensions
- **Custom Threshold Editor** – Allow users to set personal alert limits for temperature, rainfall, or wind speed.  
- **Notification System** – Real-time alerts via email or dashboard pop-ups when thresholds are exceeded.  
- **Tracking Dashboard** – Historical and seasonal trend tracking for selected locations.  
- **Planning Assistant** – AI-based recommendations for travel or event planning based on weather outlooks.  
- **User Accounts & Persistence** – Secure login system to store preferences, locations, and alert settings.

## Acknowledgements
- Interactive mapping powered by [Leaflet.js](https://leafletjs.com/)  
- Chart visualizations powered by [ApexCharts.js](https://apexcharts.com/)  
- Icons via [Google Fonts](https://fonts.google.com/)  
- Logo design assisted by Canva AI  
- Climate and weather datasets used in this project are provided by [NASA OpenDAP](https://opendap.org/)

## License
This project is for educational/demo use only. Please contact the authors for reuse or
