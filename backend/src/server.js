const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory state for the window
let windowState = {
  isOpen: false,
  lastUpdated: new Date().toISOString(),
  autoMode: true,
};

// Mock weather data generator
function getWeatherData() {
  return {
    pollution: {
      value: Math.floor(Math.random() * 100),
      unit: 'AQI',
      status: Math.random() > 0.5 ? 'Good' : 'Moderate',
    },
    sunlight: {
      value: Math.floor(Math.random() * 100),
      unit: '%',
      intensity: Math.random() > 0.3 ? 'High' : 'Low',
    },
    windSpeed: {
      value: Math.floor(Math.random() * 50),
      unit: 'km/h',
      status: Math.random() > 0.6 ? 'Calm' : 'Moderate',
    },
    temperature: {
      value: 15 + Math.floor(Math.random() * 20),
      unit: '°C',
    },
    timestamp: new Date().toISOString(),
  };
}

// Determine if window should be open based on weather
function shouldWindowBeOpen(weatherData) {
  const { pollution, sunlight, windSpeed } = weatherData;
  
  // Close window if pollution is high
  if (pollution.value > 70) return false;
  
  // Close window if wind speed is too high
  if (windSpeed.value > 40) return false;
  
  // Open window if sunlight is good and conditions are favorable
  if (sunlight.value > 50 && pollution.value < 50 && windSpeed.value < 30) {
    return true;
  }
  
  return false;
}

// Routes

// Get current weather data
app.get('/api/weather', (req, res) => {
  const weatherData = getWeatherData();
  res.json(weatherData);
});

// Get window status
app.get('/api/window/status', (req, res) => {
  res.json(windowState);
});

// Control window (manual mode)
app.post('/api/window/control', (req, res) => {
  const { action, autoMode } = req.body;
  
  if (autoMode !== undefined) {
    windowState.autoMode = autoMode;
  }
  
  if (action === 'open' || action === 'close') {
    windowState.isOpen = action === 'open';
    windowState.lastUpdated = new Date().toISOString();
    windowState.autoMode = false; // Switch to manual mode when controlled
  }
  
  res.json({
    success: true,
    state: windowState,
  });
});

// Get window recommendation based on current weather
app.get('/api/window/recommendation', (req, res) => {
  const weatherData = getWeatherData();
  const shouldBeOpen = shouldWindowBeOpen(weatherData);
  
  res.json({
    recommendation: shouldBeOpen ? 'open' : 'close',
    reason: shouldBeOpen 
      ? 'Weather conditions are favorable for opening the window'
      : 'Weather conditions suggest keeping the window closed',
    weatherData,
  });
});

// Auto-update window based on weather (runs every 30 seconds if auto mode is on)
setInterval(() => {
  if (windowState.autoMode) {
    const weatherData = getWeatherData();
    const shouldBeOpen = shouldWindowBeOpen(weatherData);
    
    if (windowState.isOpen !== shouldBeOpen) {
      windowState.isOpen = shouldBeOpen;
      windowState.lastUpdated = new Date().toISOString();
      console.log(`Auto-mode: Window ${shouldBeOpen ? 'opened' : 'closed'} based on weather conditions`);
    }
  }
}, 30000);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Smart Window API Server running on port ${PORT}`);
  console.log(`- Weather data: http://localhost:${PORT}/api/weather`);
  console.log(`- Window status: http://localhost:${PORT}/api/window/status`);
  console.log(`- Window control: http://localhost:${PORT}/api/window/control (POST)`);
  console.log(`- Recommendation: http://localhost:${PORT}/api/window/recommendation`);
});
