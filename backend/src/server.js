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

// Cached external data (refreshed periodically). The frontend can poll `/api/weather` every
// second for the UI and backend will return the last cached value. The backend refresh
// interval is configurable via EXTERNAL_FETCH_INTERVAL (seconds). Default is 5s to avoid
// overloading free tier APIs; set to 1 for real-time (beware rate limits).
const cached = {
  weather: null,
  pollution: null,
  lastFetched: null,
};

const EXTERNAL_FETCH_INTERVAL = parseInt(process.env.EXTERNAL_FETCH_INTERVAL, 10) || 5; // seconds
const DECISION_INTERVAL = parseInt(process.env.DECISION_INTERVAL, 10) || 1800; // seconds (30 minutes)

// Helper: fetch JSON safely
async function safeFetchJson(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${txt}`);
    }
    return await resp.json();
  } catch (err) {
    console.error('safeFetchJson error for', url, err.message || err);
    return null;
  }
}

// Fetch external weather and pollution data and store to `cached`.
async function refreshExternalData() {
  const lat = process.env.DEFAULT_LAT || '45.1885';
  const lon = process.env.DEFAULT_LON || '5.7245';
  const meteosourceKey = process.env.METEOSOURCE_API_KEY;
  const iqairKey = process.env.IQAIR_API_KEY;
  const openKey = process.env.OPENWEATHER_API_KEY;

  // Fetch weather from MeteoSource if key provided
  if (meteosourceKey) {
    const url = `https://api.meteosource.com/v1/free/point?lat=${lat}&lon=${lon}&sections=current&timezone=Europe%2FParis&language=en&key=${meteosourceKey}`;
    const data = await safeFetchJson(url);
    if (data) {
      cached.weather = { source: 'meteosource', fetchedAt: new Date().toISOString(), data };
    }
  }

  // Fetch pollution: prefer IQAir, fallback to OpenWeather if present
  if (iqairKey) {
    const url = `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${iqairKey}`;
    const data = await safeFetchJson(url);
    if (data) cached.pollution = { source: 'iqair', fetchedAt: new Date().toISOString(), data };
  } else if (openKey) {
    const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${openKey}`;
    const data = await safeFetchJson(url);
    if (data) cached.pollution = { source: 'openweather', fetchedAt: new Date().toISOString(), data };
  }

  cached.lastFetched = new Date().toISOString();
}

// Start periodic refresh (runs in the background)
setInterval(() => {
  refreshExternalData().catch((err) => console.error('refreshExternalData failed', err));
}, Math.max(1, EXTERNAL_FETCH_INTERVAL) * 1000);

// Do an initial refresh at startup (best-effort)
refreshExternalData().catch(() => {});

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

// Get current weather data (returns cached external data when available)
app.get('/api/weather', (req, res) => {
  if (cached.weather) {
    return res.json({
      source: cached.weather.source,
      fetchedAt: cached.weather.fetchedAt,
      data: cached.weather.data,
    });
  }

  const weatherData = getWeatherData();
  res.json({ source: 'mock', fetchedAt: new Date().toISOString(), data: weatherData });
});

// Proxy to external weather provider (MeteoSource)
// Example: /api/external/weather?lat=45.1885&lon=5.7245
app.get('/api/external/weather', async (req, res) => {
  const apiKey = process.env.METEOSOURCE_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'METEOSOURCE_API_KEY not set in environment' });
  }

  const lat = req.query.lat || '45.1885';
  const lon = req.query.lon || '5.7245';

  try {
    const url = `https://api.meteosource.com/v1/free/point?lat=${lat}&lon=${lon}&sections=current&timezone=Europe%2FParis&language=en&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }
    const data = await response.json();
    res.json({ source: 'meteosource', data });
  } catch (err) {
    console.error('Error fetching from MeteoSource', err);
    res.status(500).json({ error: 'Failed to fetch external weather' });
  }
});

// Proxy to external pollution provider (IQAir or OpenWeather)
// Example: /api/external/pollution?lat=45.1885&lon=5.7245
app.get('/api/external/pollution', async (req, res) => {
  const lat = req.query.lat || '45.1885';
  const lon = req.query.lon || '5.7245';

  // Prefer IQAir if API key present
  const iqairKey = process.env.IQAIR_API_KEY;
  const openKey = process.env.OPENWEATHER_API_KEY;

  try {
    if (iqairKey) {
      const url = `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${iqairKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: text });
      }
      const data = await response.json();
      return res.json({ source: 'iqair', data });
    }

    if (openKey) {
      const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${openKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: text });
      }
      const data = await response.json();
      return res.json({ source: 'openweather', data });
    }

    return res.status(400).json({ error: 'No pollution API key set (IQAIR_API_KEY or OPENWEATHER_API_KEY)' });
  } catch (err) {
    console.error('Error fetching pollution data', err);
    res.status(500).json({ error: 'Failed to fetch pollution data' });
  }
});

// Return last cached pollution data
app.get('/api/pollution', (req, res) => {
  if (cached.pollution) {
    return res.json({ source: cached.pollution.source, fetchedAt: cached.pollution.fetchedAt, data: cached.pollution.data });
  }
  return res.status(404).json({ error: 'No cached pollution data available. Set IQAIR_API_KEY or OPENWEATHER_API_KEY and restart backend.' });
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
  // Use cached external data for recommendation when available, otherwise use mock
  let weatherData = null;
  if (cached.weather && cached.pollution) {
    // Try to synthesize a minimal weatherData object expected by shouldWindowBeOpen
    // Note: external API shapes vary, so we fallback to mock generator if mapping is not possible
    try {
      const pollutionVal = (() => {
        if (cached.pollution.source === 'iqair' && cached.pollution.data && cached.pollution.data.data && cached.pollution.data.data.current && cached.pollution.data.data.current.pollution && cached.pollution.data.data.current.pollution.aqius) {
          return cached.pollution.data.data.current.pollution.aqius;
        }
        if (cached.pollution.source === 'openweather' && cached.pollution.data && cached.pollution.data.list && cached.pollution.data.list[0] && cached.pollution.data.list[0].main && cached.pollution.data.list[0].main.aqi) {
          // OpenWeather aqi is 1-5; map to an approximate AQI (1->50,5->300)
          const a = cached.pollution.data.list[0].main.aqi;
          return Math.min(300, Math.round(((a - 1) / 4) * 250 + 50));
        }
        return null;
      })();

      const weather = cached.weather.data;
      // meteosource free current section shape: weather.current.temperature, wind_kph, cloudiness, etc.
      const sunlightVal = (weather && weather.current && typeof weather.current.sunlight === 'number') ? weather.current.sunlight : null;
      const windVal = (weather && weather.current && (weather.current.wind_kph || weather.current.wind_ms || weather.current.wind_speed)) || null;
      const tempVal = (weather && weather.current && (weather.current.temperature || weather.current.temp)) || null;

      if (pollutionVal !== null) {
        weatherData = {
          pollution: { value: pollutionVal, unit: 'AQI' },
          sunlight: { value: sunlightVal || 50, unit: '%' },
          windSpeed: { value: windVal ? Number(windVal) : 10, unit: 'km/h' },
          temperature: { value: tempVal || 18, unit: '°C' },
          timestamp: cached.lastFetched,
        };
      }
    } catch (err) {
      weatherData = null;
    }
  }

  if (!weatherData) weatherData = getWeatherData();

  const shouldBeOpen = shouldWindowBeOpen(weatherData);

  res.json({
    recommendation: shouldBeOpen ? 'open' : 'close',
    reason: shouldBeOpen ? 'Weather conditions are favorable for opening the window' : 'Weather conditions suggest keeping the window closed',
    weatherData,
  });
});

// Auto-update window based on weather. Runs every DECISION_INTERVAL seconds when auto mode is on.
setInterval(() => {
  if (!windowState.autoMode) return;

  // Use cached data when possible to decide, otherwise fallback to mock
  let weatherData = null;
  try {
    if (cached.pollution || cached.weather) {
      // Reuse the recommendation synthesis logic by calling the recommendation endpoint logic
      // Build a minimal weatherData similar to above
      const pollutionVal = (cached.pollution && cached.pollution.source === 'iqair' && cached.pollution.data && cached.pollution.data.data && cached.pollution.data.data.current && cached.pollution.data.data.current.pollution && cached.pollution.data.data.current.pollution.aqius)
        ? cached.pollution.data.data.current.pollution.aqius
        : (cached.pollution && cached.pollution.source === 'openweather' && cached.pollution.data && cached.pollution.data.list && cached.pollution.data.list[0] && cached.pollution.data.list[0].main && cached.pollution.data.list[0].main.aqi)
          ? Math.min(300, Math.round(((cached.pollution.data.list[0].main.aqi - 1) / 4) * 250 + 50))
          : null;

      const weather = cached.weather && cached.weather.data;
      const sunlightVal = (weather && weather.current && typeof weather.current.sunlight === 'number') ? weather.current.sunlight : null;
      const windVal = (weather && weather.current && (weather.current.wind_kph || weather.current.wind_ms || weather.current.wind_speed)) || null;
      const tempVal = (weather && weather.current && (weather.current.temperature || weather.current.temp)) || null;

      if (pollutionVal !== null) {
        weatherData = {
          pollution: { value: pollutionVal, unit: 'AQI' },
          sunlight: { value: sunlightVal || 50, unit: '%' },
          windSpeed: { value: windVal ? Number(windVal) : 10, unit: 'km/h' },
          temperature: { value: tempVal || 18, unit: '°C' },
          timestamp: cached.lastFetched,
        };
      }
    }
  } catch (err) {
    weatherData = null;
  }

  if (!weatherData) weatherData = getWeatherData();

  const shouldBeOpen = shouldWindowBeOpen(weatherData);

  if (windowState.isOpen !== shouldBeOpen) {
    windowState.isOpen = shouldBeOpen;
    windowState.lastUpdated = new Date().toISOString();
    console.log(`Auto-mode: Window ${shouldBeOpen ? 'opened' : 'closed'} based on weather conditions`);
  }
}, Math.max(1, DECISION_INTERVAL) * 1000);

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
