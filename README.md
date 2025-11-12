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

## Open-Meteo combined endpoint (weather + air-quality)

The backend exposes a combined Open-Meteo endpoint which fetches current weather and air-quality (european_aqi) in two requests and returns a normalized JSON object. The endpoint is:

```
GET /api/external/open-meteo?lat=<latitude>&lon=<longitude>
```

Normalized response fields (examples):

- `temperature` (°C)
- `wind_speed` (km/h)
- `is_day` (boolean) — currently determined by a UTC-hour heuristic (6–17)
- `european_aqi` (EAQI)
- `timestamp` (UTC time string)
- `raw` (original provider responses)

Caching and TTL

- Responses are cached in-memory per `lat,lon` to avoid repeated external requests. The default cache TTL is 1 hour.
- Override TTL by setting the environment variable `OPEN_METEO_CACHE_TTL_MS` (milliseconds) when starting the backend.

Example:

```
export OPEN_METEO_CACHE_TTL_MS=3600000
```

Installing client

The backend `package.json` already lists an Open-Meteo client. To ensure the dependency is installed, run from the repo root:

```bash
cd backend
npm install
# or explicitly (fallback tries both possible package names):
cd backend && npm install openmeteo || npm install open-meteo
```

After installing, restart the backend and call the endpoint:

```
curl "http://localhost:3001/api/external/open-meteo?lat=45.1885&lon=5.7245"
```

<!-- Local hostname instructions removed. The web dev server binds to localhost by default. -->
