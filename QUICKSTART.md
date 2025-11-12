# Quick Start Guide

This guide will help you get the Smart Window Control System up and running quickly.

## Prerequisites

- Node.js 18+ installed
- npm installed
- For mobile development:
  - Android Studio (for Android)
  - Xcode (for iOS, macOS only)

## Quick Start (3 Steps)

### 1. Start the Backend Server

```bash
cd backend
npm install
npm start
```

The backend will start on `http://localhost:3001`. Keep this terminal running.

If you plan to use the Open-Meteo combined endpoint (`/api/external/open-meteo`), make sure the backend dependencies are installed. The `openmeteo` client is already listed in `backend/package.json`; running `npm install` in the `backend/` folder will install it. Alternatively you can explicitly run:

```bash
# from the repo root
cd backend && npm install openmeteo || npm install open-meteo
```

### 2. Start the Web App

Open a new terminal:

```bash
cd web
npm install
npm start
```

The web app will automatically open in your browser at `http://localhost:3000`.

### 3. (Optional) Start the Mobile App

For Android:
```bash
cd mobile
npm install
npx react-native run-android
```

For iOS (macOS only):
```bash
cd mobile
npm install
cd ios && pod install && cd ..
npx react-native run-ios
```

**Important for Physical Devices:** Update the `API_URL` in `mobile/App.tsx` to your computer's IP address instead of `localhost`.

## Usage

### Web App Features

1. **View Weather Data**: See real-time pollution, sunlight, wind speed, and temperature
2. **Control Window**: 
   - Toggle Auto Mode on/off
   - Click "Open Window" or "Close Window" buttons (when auto mode is off)
3. **Monitor Status**: See current window state (open/closed) and last update time

### Mobile App Features

Same as web app, plus:
- Pull down to refresh data manually
- Native mobile UI optimized for touch

## Testing the API

You can test the backend API directly with curl:

```bash
# Get current weather
curl http://localhost:3001/api/weather

# Get window status
curl http://localhost:3001/api/window/status

# Open the window
curl -X POST http://localhost:3001/api/window/control \
  -H "Content-Type: application/json" \
  -d '{"action": "open"}'

# Close the window
curl -X POST http://localhost:3001/api/window/control \
  -H "Content-Type: application/json" \
  -d '{"action": "close"}'

# Enable auto mode
curl -X POST http://localhost:3001/api/window/control \
  -H "Content-Type: application/json" \
  -d '{"autoMode": true}'
```

## Understanding Auto Mode

When **Auto Mode is ON**:
- The system automatically controls the window every 30 seconds
- Window opens when conditions are favorable (good air quality, moderate wind, good sunlight)
- Window closes when conditions are poor (high pollution, strong wind)

When **Auto Mode is OFF**:
- You have manual control of the window
- Click "Open Window" or "Close Window" to control it manually

## Troubleshooting

### Backend won't start
- Make sure port 3001 is not already in use
- Run `npm install` in the backend folder

### Web app can't connect to backend
- Make sure the backend is running on port 3001
- Check that there are no firewall issues blocking localhost:3001

### Mobile app can't connect
- On physical devices, update `API_URL` in `mobile/App.tsx` to your computer's IP
- Make sure your mobile device is on the same network as your computer
- Check firewall settings on your computer

## Production Build

To create a production build of the web app:

```bash
cd web
npm run build
```

The optimized files will be in the `web/build` folder, ready to deploy to any static hosting service.

## Next Steps

- Customize the weather thresholds in `backend/src/server.js`
- Modify the UI colors and styles in `web/src/App.css` or `mobile/App.tsx`
- Add real weather API integration (replace mock data)
- Deploy to production servers

Enjoy your Smart Window Control System! 🪟
