import { Platform } from 'react-native';

// Attempt to load local config.json if present (not committed)
let localConfig: { apiBaseUrl?: string } = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  localConfig = require('../config.json');
} catch (e) {
  // No local config provided; will fall back to platform defaults
}

// Defaults:
// - Android emulator: use 10.0.2.2 to reach host machine
// - iOS simulator: localhost works
// - Physical devices: create mobile/config.json with your PC IP (e.g. http://192.168.1.50:3001)
export const API_URL =
  localConfig.apiBaseUrl ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001');
