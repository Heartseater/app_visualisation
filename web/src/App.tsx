import React, { useState, useEffect } from 'react';
import './App.css';

interface WeatherData {
  pollution: {
    value: number;
    unit: string;
    status: string;
  };
  sunlight: {
    value: number;
    unit: string;
    intensity: string;
  };
  windSpeed: {
    value: number;
    unit: string;
    status: string;
  };
  temperature: {
    value: number;
    unit: string;
  };
  timestamp: string;
}

interface WindowState {
  isOpen: boolean;
  lastUpdated: string;
  autoMode: boolean;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [windowState, setWindowState] = useState<WindowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/weather`);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      const data = await response.json();
      setWeatherData(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch weather data. Make sure the backend server is running on port 3001.');
      console.error(err);
    }
  };

  const fetchWindowStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/window/status`);
      if (!response.ok) throw new Error('Failed to fetch window status');
      const data = await response.json();
      setWindowState(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch window status. Make sure the backend server is running on port 3001.');
      console.error(err);
    }
  };

  const controlWindow = async (action: 'open' | 'close') => {
    try {
      const response = await fetch(`${API_URL}/api/window/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error('Failed to control window');
      const data = await response.json();
      setWindowState(data.state);
      setError(null);
    } catch (err) {
      setError('Failed to control window');
      console.error(err);
    }
  };

  const toggleAutoMode = async () => {
    if (!windowState) return;
    try {
      const response = await fetch(`${API_URL}/api/window/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ autoMode: !windowState.autoMode }),
      });
      if (!response.ok) throw new Error('Failed to toggle auto mode');
      const data = await response.json();
      setWindowState(data.state);
      setError(null);
    } catch (err) {
      setError('Failed to toggle auto mode');
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchWeatherData(), fetchWindowStatus()]);
      setLoading(false);
    };

    fetchData();

    // Refresh data every 5 seconds
    const interval = setInterval(() => {
      fetchWeatherData();
      fetchWindowStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, thresholds: { low: number; high: number }) => {
    if (value < thresholds.low) return '#4CAF50'; // Green
    if (value < thresholds.high) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading smart window system...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🪟 Smart Window Control System</h1>
        <p className="subtitle">Real-time Weather Monitoring & Window Control</p>
      </header>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      <main className="main-content">
        {/* Window Status Section */}
        <section className="window-section">
          <h2>Window Status</h2>
          <div className={`window-display ${windowState?.isOpen ? 'open' : 'closed'}`}>
            <div className="window-icon">
              {windowState?.isOpen ? '🪟' : '🚪'}
            </div>
            <div className="window-status">
              <h3>{windowState?.isOpen ? 'OPEN' : 'CLOSED'}</h3>
              <p className="timestamp">
                Last updated: {windowState?.lastUpdated ? new Date(windowState.lastUpdated).toLocaleTimeString() : 'N/A'}
              </p>
              <div className="auto-mode">
                <label>
                  <input
                    type="checkbox"
                    checked={windowState?.autoMode || false}
                    onChange={toggleAutoMode}
                  />
                  <span>Auto Mode {windowState?.autoMode ? '✓' : ''}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="control-buttons">
            <button
              className="btn btn-open"
              onClick={() => controlWindow('open')}
              disabled={windowState?.autoMode}
            >
              Open Window
            </button>
            <button
              className="btn btn-close"
              onClick={() => controlWindow('close')}
              disabled={windowState?.autoMode}
            >
              Close Window
            </button>
          </div>
          {windowState?.autoMode && (
            <p className="auto-mode-notice">
              ℹ️ Window is in auto mode. Disable auto mode to manually control the window.
            </p>
          )}
        </section>

        {/* Weather Data Section */}
        <section className="weather-section">
          <h2>Weather Conditions</h2>
          <div className="weather-grid">
            {/* Pollution */}
            <div className="weather-card">
              <div className="weather-icon">🏭</div>
              <h3>Air Pollution</h3>
              <div
                className="weather-value"
                style={{ color: getStatusColor(weatherData?.pollution.value || 0, { low: 50, high: 70 }) }}
              >
                {weatherData?.pollution.value} {weatherData?.pollution.unit}
              </div>
              <p className="weather-status">{weatherData?.pollution.status}</p>
            </div>

            {/* Sunlight */}
            <div className="weather-card">
              <div className="weather-icon">☀️</div>
              <h3>Sunlight</h3>
              <div
                className="weather-value"
                style={{ color: getStatusColor(100 - (weatherData?.sunlight.value || 0), { low: 50, high: 70 }) }}
              >
                {weatherData?.sunlight.value} {weatherData?.sunlight.unit}
              </div>
              <p className="weather-status">{weatherData?.sunlight.intensity} Intensity</p>
            </div>

            {/* Wind Speed */}
            <div className="weather-card">
              <div className="weather-icon">💨</div>
              <h3>Wind Speed</h3>
              <div
                className="weather-value"
                style={{ color: getStatusColor(weatherData?.windSpeed.value || 0, { low: 20, high: 40 }) }}
              >
                {weatherData?.windSpeed.value} {weatherData?.windSpeed.unit}
              </div>
              <p className="weather-status">{weatherData?.windSpeed.status}</p>
            </div>

            {/* Temperature */}
            <div className="weather-card">
              <div className="weather-icon">🌡️</div>
              <h3>Temperature</h3>
              <div className="weather-value">
                {weatherData?.temperature.value} {weatherData?.temperature.unit}
              </div>
              <p className="weather-status">Current</p>
            </div>
          </div>

          <p className="data-timestamp">
            Data updated: {weatherData?.timestamp ? new Date(weatherData.timestamp).toLocaleString() : 'N/A'}
          </p>
        </section>
      </main>

      <footer className="App-footer">
        <p>Smart Window System - Powered by Real-time Weather Data</p>
      </footer>
    </div>
  );
}

export default App;
