import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SensorRowProps {
  temp?: number;
  aqi?: number;
}

export const SensorRow: React.FC<SensorRowProps> = ({ temp, aqi }) => {
  return (
    <View style={styles.row}>
      <Text style={styles.value}>🌡️ {temp ?? '--'}°C</Text>
      <Text style={styles.value}>🏭 AQI {aqi ?? '--'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 25,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
});