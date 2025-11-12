# Smart Window Control System

A full-stack application for visualizing and controlling a smart window system based on real-time weather conditions. The system includes a React web app, React Native mobile app, and Node.js backend API.

![Web App Screenshot](https://github.com/user-attachments/assets/49ab12ae-6432-41bb-8834-8d1e5aad6175)

## Features

- 🌤️ **Real-time Weather Monitoring**: Track pollution levels, sunlight intensity, wind speed, and temperature
- 🪟 **Window Control**: Manual and automatic window control based on weather conditions
- 🔄 **Auto Mode**: Automatically opens/closes windows based on weather conditions
- 📱 **Mobile App**: React Native app for iOS and Android
- 💻 **Web App**: Responsive React web application
- 🔌 **REST API**: Backend API for weather data and window control

## Project Structure

```
app_visualisation/
├── backend/          # Node.js Express API server
│   ├── src/
│   │   └── server.js # Main server file with API endpoints
│   └── package.json
├── web/              # React web application
│   ├── src/
│   │   ├── App.tsx   # Main app component
│   │   └── App.css   # Styles
│   └── package.json
├── mobile/           # React Native mobile app
│   ├── App.tsx       # Main mobile app component
│   ├── android/      # Android project files
│   ├── ios/          # iOS project files
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- For mobile development:
  - Android Studio (for Android)
  - Xcode (for iOS, macOS only)

## Installation & Setup

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend server will start on `http://localhost:3001`

**API Endpoints:**
- `GET /api/weather` - Get current weather data
- `GET /api/window/status` - Get window status
- `POST /api/window/control` - Control window (open/close/auto mode)
- `GET /api/window/recommendation` - Get AI recommendation
- `GET /api/health` - Health check endpoint

### 2. Web App Setup

```bash
cd web
npm install
npm start
```

The web app will open at `http://localhost:3000`

**Build for production:**
```bash
npm run build
```

### 3. Mobile App Setup

```bash
cd mobile
npm install
```

**For Android:**
```bash
npx react-native run-android
```

**For iOS (macOS only):**
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

**Note:** Update the `API_URL` in `mobile/App.tsx` to point to your backend server IP address when testing on a physical device.

## How It Works

### Weather-Based Window Control

The system uses the following logic to determine when to automatically open or close the window:

- **Close Window If:**
  - Air pollution > 70 AQI
  - Wind speed > 40 km/h

- **Open Window If:**
  - Sunlight > 50%
  - Air pollution < 50 AQI
  - Wind speed < 30 km/h

### Auto Mode

When auto mode is enabled, the window automatically adjusts every 30 seconds based on weather conditions. Users can disable auto mode to manually control the window.

## Technology Stack

**Backend:**
- Node.js
- Express.js
- CORS middleware

**Web App:**
- React 18
- TypeScript
- CSS3 with responsive design

**Mobile App:**
- React Native
- TypeScript
- Native iOS & Android components

## API Documentation

### GET /api/weather

Returns current weather data:

```json
{
  "pollution": {
    "value": 45,
    "unit": "AQI",
    "status": "Good"
  },
  "sunlight": {
    "value": 65,
    "unit": "%",
    "intensity": "High"
  },
  "windSpeed": {
    "value": 20,
    "unit": "km/h",
    "status": "Calm"
  },
  "temperature": {
    "value": 22,
    "unit": "°C"
  },
  "timestamp": "2025-11-11T23:00:00.000Z"
}
```

### GET /api/window/status

Returns current window state:

```json
{
  "isOpen": true,
  "lastUpdated": "2025-11-11T23:00:00.000Z",
  "autoMode": true
}
```

### POST /api/window/control

Control the window. Request body:

```json
{
  "action": "open",      // "open" or "close"
  "autoMode": true       // true or false (optional)
}
```

Response:

```json
{
  "success": true,
  "state": {
    "isOpen": true,
    "lastUpdated": "2025-11-11T23:00:00.000Z",
    "autoMode": false
  }
}
```

## Development

### Running All Services

You can run all three services simultaneously:

1. Terminal 1: `cd backend && npm start`
2. Terminal 2: `cd web && npm start`
3. Terminal 3: `cd mobile && npx react-native run-android` (or run-ios)

### Testing the API

```bash
# Get weather data
curl http://localhost:3001/api/weather

# Get window status
curl http://localhost:3001/api/window/status

# Open window
curl -X POST http://localhost:3001/api/window/control \
  -H "Content-Type: application/json" \
  -d '{"action": "open"}'

# Enable auto mode
curl -X POST http://localhost:3001/api/window/control \
  -H "Content-Type: application/json" \
  -d '{"autoMode": true}'
```

## License

ISC

## Author

Heartseater

## External APIs & Keys

This project can forward requests to real external weather and pollution providers. To enable them set the following environment variables for the backend service (for example, in your shell or a `.env` when running locally):

- `METEOSOURCE_API_KEY` — API key for MeteoSource (weather). Used by `/api/external/weather`.
- `IQAIR_API_KEY` — API key for IQAir (pollution). Used by `/api/external/pollution` when present.
- `OPENWEATHER_API_KEY` — API key for OpenWeather (pollution fallback). Used by `/api/external/pollution` if IQAir key is not present.

Example (bash):

```
export METEOSOURCE_API_KEY=your_meteosource_key_here
export IQAIR_API_KEY=your_iqair_key_here
export OPENWEATHER_API_KEY=your_openweather_key_here
```

Then restart the backend. You can call:

```
# example: fetch MeteoSource for Grenoble
curl "http://localhost:3001/api/external/weather?lat=45.1885&lon=5.7245"

# example: fetch pollution (IQAir preferred)
curl "http://localhost:3001/api/external/pollution?lat=45.1885&lon=5.7245"
```

<!-- Local hostname instructions removed. The web dev server binds to localhost by default. -->

## Backend polling, intervals & frontend polling recommendation

The backend now periodically fetches external weather and pollution data and keeps the latest values cached. Configuration (env vars):

- `EXTERNAL_FETCH_INTERVAL` — how often the backend will refresh external provider data (in seconds). Default: `5` (seconds). To minimize API usage set this higher.
- `DECISION_INTERVAL` — how often the backend will evaluate auto window open/close logic (in seconds). Default: `1800` (30 minutes).

Notes and recommendations:

- The frontend (web UI) can safely poll the backend `/api/weather` endpoint every second to provide a smooth, real-time visualization; the backend will return the last cached external value or a mock if no API key is configured.
- To avoid hitting free-tier API rate limits, set `EXTERNAL_FETCH_INTERVAL` to a reasonable value (for example 5–30 seconds). The frontend polling frequency and backend external fetch interval are independent — frontend reads cached data from the backend.
- The window auto-decision runs at `DECISION_INTERVAL` to prevent frequent open/close cycles. The default is 30 minutes so the window won't open/close multiple times within a minute.

Example (bash) to run backend with custom intervals:

```
export METEOSOURCE_API_KEY=...
export IQAIR_API_KEY=...
export EXTERNAL_FETCH_INTERVAL=10
export DECISION_INTERVAL=1800
node src/server.js
```

API endpoints to use from the frontend:

- `GET /api/weather` — returns the last cached weather data (use this for live UI polling every second)
- `GET /api/pollution` — returns last cached pollution data (if needed separately)
- `GET /api/window/recommendation` — returns an open/close recommendation computed from the cached/latest data

If you need true push updates to the UI, consider adding WebSockets or Server-Sent Events in a follow-up change.
