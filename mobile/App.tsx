/**
 * Smart Window Control System - Mobile App
 * React Native application for controlling windows based on weather conditions
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Switch,
  ActivityIndicator,
} from 'react-native';

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

// API base URL configured via src/config.ts (handles emulator vs device)
import {API_URL} from './src/config';

function App(): React.JSX.Element {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [windowState, setWindowState] = useState<WindowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/weather`);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      const data = await response.json();
      setWeatherData(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch weather data. Make sure the backend is running.');
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
      setError('Failed to fetch window status.');
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
        body: JSON.stringify({action}),
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
        body: JSON.stringify({autoMode: !windowState.autoMode}),
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

  const fetchData = async () => {
    await Promise.all([fetchWeatherData(), fetchWindowStatus()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    loadData();

    // Refresh data every 5 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (
    value: number,
    thresholds: {low: number; high: number},
  ) => {
    if (value < thresholds.low) return '#4CAF50'; // Green
    if (value < thresholds.high) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading Smart Window System...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🪟 Smart Window Control</Text>
          <Text style={styles.headerSubtitle}>
            Real-time Weather Monitoring
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Window Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Window Status</Text>
          <View
            style={[
              styles.windowDisplay,
              windowState?.isOpen ? styles.windowOpen : styles.windowClosed,
            ]}>
            <Text style={styles.windowIcon}>
              {windowState?.isOpen ? '🪟' : '🚪'}
            </Text>
            <View style={styles.windowInfo}>
              <Text style={styles.windowStatusText}>
                {windowState?.isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
              <Text style={styles.timestamp}>
                Last updated:{' '}
                {windowState?.lastUpdated
                  ? new Date(windowState.lastUpdated).toLocaleTimeString()
                  : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Auto Mode Toggle */}
          <View style={styles.autoModeContainer}>
            <Text style={styles.autoModeLabel}>Auto Mode</Text>
            <Switch
              value={windowState?.autoMode || false}
              onValueChange={toggleAutoMode}
              trackColor={{false: '#767577', true: '#81b0ff'}}
              thumbColor={windowState?.autoMode ? '#667eea' : '#f4f3f4'}
            />
          </View>

          {/* Control Buttons */}
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonOpen,
                windowState?.autoMode && styles.buttonDisabled,
              ]}
              onPress={() => controlWindow('open')}
              disabled={windowState?.autoMode}>
              <Text style={styles.buttonText}>Open Window</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonClose,
                windowState?.autoMode && styles.buttonDisabled,
              ]}
              onPress={() => controlWindow('close')}
              disabled={windowState?.autoMode}>
              <Text style={styles.buttonText}>Close Window</Text>
            </TouchableOpacity>
          </View>

          {windowState?.autoMode && (
            <Text style={styles.autoModeNotice}>
              ℹ️ Window is in auto mode. Disable to manually control.
            </Text>
          )}
        </View>

        {/* Weather Conditions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather Conditions</Text>

          {/* Weather Cards */}
          <View style={styles.weatherGrid}>
            {/* Air Pollution */}
            <View style={styles.weatherCard}>
              <Text style={styles.weatherIcon}>🏭</Text>
              <Text style={styles.weatherCardTitle}>Air Pollution</Text>
              <Text
                style={[
                  styles.weatherValue,
                  {
                    color: getStatusColor(weatherData?.pollution.value || 0, {
                      low: 50,
                      high: 70,
                    }),
                  },
                ]}>
                {weatherData?.pollution.value} {weatherData?.pollution.unit}
              </Text>
              <Text style={styles.weatherStatus}>
                {weatherData?.pollution.status}
              </Text>
            </View>

            {/* Sunlight */}
            <View style={styles.weatherCard}>
              <Text style={styles.weatherIcon}>☀️</Text>
              <Text style={styles.weatherCardTitle}>Sunlight</Text>
              <Text
                style={[
                  styles.weatherValue,
                  {
                    color: getStatusColor(
                      100 - (weatherData?.sunlight.value || 0),
                      {low: 50, high: 70},
                    ),
                  },
                ]}>
                {weatherData?.sunlight.value} {weatherData?.sunlight.unit}
              </Text>
              <Text style={styles.weatherStatus}>
                {weatherData?.sunlight.intensity} Intensity
              </Text>
            </View>

            {/* Wind Speed */}
            <View style={styles.weatherCard}>
              <Text style={styles.weatherIcon}>💨</Text>
              <Text style={styles.weatherCardTitle}>Wind Speed</Text>
              <Text
                style={[
                  styles.weatherValue,
                  {
                    color: getStatusColor(weatherData?.windSpeed.value || 0, {
                      low: 20,
                      high: 40,
                    }),
                  },
                ]}>
                {weatherData?.windSpeed.value} {weatherData?.windSpeed.unit}
              </Text>
              <Text style={styles.weatherStatus}>
                {weatherData?.windSpeed.status}
              </Text>
            </View>

            {/* Temperature */}
            <View style={styles.weatherCard}>
              <Text style={styles.weatherIcon}>🌡️</Text>
              <Text style={styles.weatherCardTitle}>Temperature</Text>
              <Text style={styles.weatherValue}>
                {weatherData?.temperature.value} {weatherData?.temperature.unit}
              </Text>
              <Text style={styles.weatherStatus}>Current</Text>
            </View>
          </View>

          <Text style={styles.dataTimestamp}>
            Data updated:{' '}
            {weatherData?.timestamp
              ? new Date(weatherData.timestamp).toLocaleString()
              : 'N/A'}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Smart Window System - Powered by Real-time Weather Data
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#667eea',
  },
  scrollView: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#667eea',
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
    opacity: 0.9,
  },
  errorBanner: {
    backgroundColor: '#f44336',
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  windowDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  windowOpen: {
    backgroundColor: '#56ab2f',
  },
  windowClosed: {
    backgroundColor: '#f5576c',
  },
  windowIcon: {
    fontSize: 60,
    marginRight: 16,
  },
  windowInfo: {
    flex: 1,
  },
  windowStatusText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  autoModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  autoModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonOpen: {
    backgroundColor: '#56ab2f',
  },
  buttonClose: {
    backgroundColor: '#f5576c',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  autoModeNotice: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    fontSize: 12,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  weatherCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  weatherCardTitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
  },
  weatherValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  weatherStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dataTimestamp: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
});

export default App;
