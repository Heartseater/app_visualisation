const express = require('express');
const cors = require('cors');
// Use the openmeteo client helper for weather fetches
let fetchWeatherApi;
try {
  ({ fetchWeatherApi } = require('openmeteo'));
} catch (e) {
  // If the package isn't installed, we'll fallback to manual fetch and log once
  console.warn('openmeteo package not available via require("openmeteo"): will use direct HTTP fetch for weather.');
}

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

// In-memory mock generator (kept as fallback)
function getMockWeatherData() {
  return {
    source: 'mock',
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

// Get current weather data (uses real Open-Meteo data when available)
app.get('/api/weather', async (req, res) => {
  try {
    const data = await getWeatherData();
    res.json(data);
  } catch (e) {
    console.error('Error in /api/weather', e);
    res.status(500).json({ error: 'Failed to retrieve weather data' });
  }
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

// Combined Open-Meteo endpoint: fetch weather and air-quality separately and return normalized values
// Example: /api/external/open-meteo?lat=45.1885&lon=5.7245
app.get('/api/external/open-meteo', async (req, res) => {
  const lat = req.query.lat || process.env.DEFAULT_LAT || '45.1885';
  const lon = req.query.lon || process.env.DEFAULT_LON || '5.7245';

  // TTL for cache in ms (default 1 hour)
  const TTL = Number(process.env.OPEN_METEO_CACHE_TTL_MS || 1000 * 60 * 60);

  // Initialize cache storage on app object if not present
  app.locals.openMeteoCache = app.locals.openMeteoCache || {};
  const cacheKey = `${lat},${lon}`;
  const cached = app.locals.openMeteoCache[cacheKey];

  // If cached and fresh, return it
  if (cached && (Date.now() - cached.fetchedAt) < TTL) {
    return res.json({ cached: true, ...cached.data });
  }

  // Otherwise fetch new data, but schedule periodic hourly fetches separately (see below)
  try {
    const result = await fetchAndNormalizeOpenMeteo(lat, lon);
    // store in cache
    app.locals.openMeteoCache[cacheKey] = { fetchedAt: Date.now(), data: result };
    return res.json({ cached: false, ...result });
  } catch (err) {
    console.error('Error fetching Open-Meteo data', err);
    return res.status(500).json({ error: 'Failed to fetch Open-Meteo data' });
  }
});

// Helper to fetch and normalize Open-Meteo data
async function fetchAndNormalizeOpenMeteo(lat, lon) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&hourly=european_aqi&timezone=UTC`;

  // Try using the openmeteo client's fetchWeatherApi if available (simpler and structured)
  let weatherJson = null;
  if (typeof fetchWeatherApi === 'function') {
    try {
      const params = {
        latitude: Number(lat),
        longitude: Number(lon),
        current: ["temperature_2m", "wind_speed_10m", "is_day"],
        timezone: 'UTC',
      };
      const responses = await fetchWeatherApi(weatherUrl, params);
      const response = Array.isArray(responses) ? responses[0] : responses;
      if (!response) throw new Error('fetchWeatherApi returned no response');

      // Try to construct a shape similar to previous 'current_weather' for downstream code
      const current = response.current && response.current();
      const utcOffsetSeconds = (typeof response.utcOffsetSeconds === 'function') ? response.utcOffsetSeconds() : 0;
      let timeIso = null;
      let temp = null;
      let windspeed = null;
      let is_day = null;

      if (current) {
        try {
          const t = (typeof current.time === 'function') ? current.time() : current.time;
          const adj = Number(t) + (utcOffsetSeconds || 0);
          timeIso = new Date(Number(adj) * 1000).toISOString();
        } catch (e) {
          timeIso = null;
        }

        try {
          const v0 = current.variables && current.variables(0);
          const v1 = current.variables && current.variables(1);
          const v2 = current.variables && current.variables(2);
          temp = v0 && (typeof v0.value === 'function' ? v0.value() : v0.value);
          windspeed = v1 && (typeof v1.value === 'function' ? v1.value() : v1.value);
          is_day = v2 && (typeof v2.value === 'function' ? v2.value() : v2.value);
        } catch (e) {
          // best-effort: leave values null if extraction fails
        }
      }

      weatherJson = { current_weather: { time: timeIso, temperature: temp, windspeed, is_day } };
    } catch (err) {
      console.error('fetchWeatherApi failed:', err && err.message ? err.message : err);
      // fallback to manual fetch below
      weatherJson = null;
    }
  }

  // If the client wasn't available or failed, fall back to the direct HTTP fetch
  if (!weatherJson) {
    const directUrl = `${weatherUrl}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&timezone=UTC`;
    let weatherResp;
    try {
      weatherResp = await fetch(directUrl);
      if (!weatherResp.ok) {
        const txt = await weatherResp.text();
        console.error(`Open-Meteo weather fetch failed for ${directUrl} - status: ${weatherResp.status} - body: ${txt}`);
        throw new Error(`Open-Meteo weather fetch failed: status ${weatherResp.status}`);
      }
      weatherJson = await weatherResp.json();
    } catch (err) {
      console.error('Error fetching Open-Meteo weather (direct):', err && err.message ? err.message : err);
      throw err;
    }
  }

  // Fetch AQI separately so we can see which part fails
  let aqiResp;
  try {
    aqiResp = await fetch(aqiUrl);
    if (!aqiResp.ok) {
      const txt = await aqiResp.text();
      console.error(`Open-Meteo air-quality fetch failed for ${aqiUrl} - status: ${aqiResp.status} - body: ${txt}`);
      throw new Error(`Open-Meteo air-quality fetch failed: status ${aqiResp.status}`);
    }
  } catch (err) {
    console.error('Error fetching Open-Meteo air-quality:', err && err.message ? err.message : err);
    throw err;
  }

  const aqiJson = await aqiResp.json();

  const current = weatherJson.current_weather || null;
  let temperature = null;
  let wind_speed = null;
  let is_day = null;
  let timestamp = null;

  if (current) {
    temperature = current.temperature ?? null;
    wind_speed = current.windspeed ?? null;
    timestamp = current.time ?? null;
    try {
      if (timestamp) {
        const dt = new Date(timestamp + 'Z');
        const hour = dt.getUTCHours();
        is_day = hour >= 6 && hour < 18;
      }
    } catch (e) {
      is_day = null;
    }
  }
  let european_aqi = null;
  if (aqiJson && aqiJson.hourly && Array.isArray(aqiJson.hourly.european_aqi)) {
    const arr = aqiJson.hourly.european_aqi;
    for (let i = arr.length - 1; i >= 0; i--) {
      const v = arr[i];
      if (v !== null && v !== undefined) {
        european_aqi = v;
        break;
      }
    }
  }

  return {
    source: 'open-meteo',
    location: { latitude: Number(lat), longitude: Number(lon) },
    timestamp,
    temperature,
    wind_speed,
    is_day,
    european_aqi,
    raw: { weather: weatherJson, air_quality: aqiJson },
  };
}

// Schedule periodic fetches for cached keys every TTL interval
// We set up a single interval that will refresh any cached locations hourly.
(function scheduleOpenMeteoRefresh() {
  const intervalMs = Number(process.env.OPEN_METEO_CACHE_TTL_MS || 1000 * 60 * 60);
  setInterval(async () => {
    const cache = app.locals.openMeteoCache || {};
    const keys = Object.keys(cache);
    for (const key of keys) {
      const [lat, lon] = key.split(',');
      try {
        const result = await fetchAndNormalizeOpenMeteo(lat, lon);
        app.locals.openMeteoCache[key] = { fetchedAt: Date.now(), data: result };
        console.log(`Refreshed Open-Meteo cache for ${key}`);
      } catch (e) {
        console.error(`Failed to refresh Open-Meteo cache for ${key}:`, e.message || e);
      }
    }
  }, intervalMs);
})();

// Map the normalized Open-Meteo shape into the legacy internal shape
function mapNormalizedToLegacy(normalized) {
  if (!normalized) return getMockWeatherData();

  const { temperature, wind_speed, is_day, european_aqi, timestamp } = normalized;

  // pollution status mapping (simple): <=50 Good, <=100 Moderate, >100 Unhealthy
  let pollutionStatus = 'Moderate';
  if (european_aqi === null || european_aqi === undefined) pollutionStatus = 'Unknown';
  else if (european_aqi <= 50) pollutionStatus = 'Good';
  else if (european_aqi <= 100) pollutionStatus = 'Moderate';
  else pollutionStatus = 'Unhealthy';

  // sunlight: represent as percentage (100 if day, 0 if night)
  const sunlightValue = (is_day === null || is_day === undefined) ? Math.floor(Math.random() * 100) : (is_day ? 100 : 0);

  // wind status
  let windStatus = 'Calm';
  if (wind_speed === null || wind_speed === undefined) windStatus = 'Unknown';
  else if (wind_speed > 40) windStatus = 'High';
  else if (wind_speed > 20) windStatus = 'Moderate';

  return {
    // keep the original source indicator if present (e.g. 'open-meteo')
    source: normalized && normalized.source ? normalized.source : 'open-meteo',
    pollution: {
      value: european_aqi ?? null,
      unit: 'EAQI',
      status: pollutionStatus,
    },
    sunlight: {
      value: sunlightValue,
      unit: '%',
      intensity: is_day ? 'High' : 'Low',
    },
    windSpeed: {
      value: wind_speed ?? null,
      unit: 'km/h',
      status: windStatus,
    },
    temperature: {
      value: temperature ?? null,
      unit: '°C',
    },
    timestamp: timestamp || new Date().toISOString(),
  };
}

// Async getter for weather data - prefers cached/open-meteo, falls back to mock
async function getWeatherData() {
  const lat = process.env.DEFAULT_LAT || '45.1885';
  const lon = process.env.DEFAULT_LON || '5.7245';
  const cacheKey = `${lat},${lon}`;
  app.locals.openMeteoCache = app.locals.openMeteoCache || {};
  const cached = app.locals.openMeteoCache[cacheKey];

  if (cached) {
    try {
      return mapNormalizedToLegacy(cached.data);
    } catch (e) {
      console.error('Error mapping cached open-meteo to legacy shape', e);
    }
  }

  try {
    const normalized = await fetchAndNormalizeOpenMeteo(lat, lon);
    app.locals.openMeteoCache[cacheKey] = { fetchedAt: Date.now(), data: normalized };
    return mapNormalizedToLegacy(normalized);
  } catch (err) {
    console.error('getWeatherData: failed to fetch Open-Meteo, using mock data', err);
    return getMockWeatherData();
  }
}

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

// Get window recommendation based on current weather (uses real data)
app.get('/api/window/recommendation', async (req, res) => {
  try {
    const weatherData = await getWeatherData();
    const shouldBeOpen = shouldWindowBeOpen(weatherData);

    res.json({
      recommendation: shouldBeOpen ? 'open' : 'close',
      reason: shouldBeOpen
        ? 'Weather conditions are favorable for opening the window'
        : 'Weather conditions suggest keeping the window closed',
      weatherData,
    });
  } catch (e) {
    console.error('Error in /api/window/recommendation', e);
    res.status(500).json({ error: 'Failed to compute recommendation' });
  }
});

// Auto-update window based on weather (runs every 30 seconds if auto mode is on)
setInterval(async () => {
  if (windowState.autoMode) {
    try {
      const weatherData = await getWeatherData();
      const shouldBeOpen = shouldWindowBeOpen(weatherData);

      if (windowState.isOpen !== shouldBeOpen) {
        windowState.isOpen = shouldBeOpen;
        windowState.lastUpdated = new Date().toISOString();
        console.log(`Auto-mode: Window ${shouldBeOpen ? 'opened' : 'closed'} based on weather conditions`);
      }
    } catch (e) {
      console.error('Auto-mode: failed to retrieve weather data', e);
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
