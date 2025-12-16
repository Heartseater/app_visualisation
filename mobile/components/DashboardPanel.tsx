import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

// Définition de la structure des données de la fenêtre
export interface WindowState {
  isOpen: boolean;
  temp: number;
  aqi: number;
  targetAngle: number;
  autoMode: boolean;
}

interface DashboardPanelProps {
  windowState: WindowState | null;
  onRefresh: () => void;
  onToggleAuto: (value: boolean) => void;
  onCommand: (action: 'open' | 'close') => void;
  onAngleChange: (angle: number) => void;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ 
  windowState, 
  onRefresh, 
  onToggleAuto, 
  onCommand, 
  onAngleChange 
}) => {
  
  const isOpen = windowState?.isOpen ?? false;
  const isAuto = windowState?.autoMode ?? true;

  return (
    <View style={[styles.card, {alignItems:'center'}]}>
      <Text style={{fontSize: 80}}>{isOpen ? '🪟' : '🚪'}</Text>
      <Text style={[styles.statusTitle, {color: isOpen ? 'green' : '#d63031'}]}>
        {isOpen ? 'OUVERTE' : 'FERMÉE'}
      </Text>

      {/* Données Météo */}
      <View style={styles.infoRow}>
        <Text style={styles.infoValue}>🌡️ {windowState?.temp ?? '--'}°C</Text>
        <Text style={styles.infoValue}>🏭 AQI {windowState?.aqi ?? '--'}</Text>
      </View>

      {/* --- CONTRÔLES --- */}
      <View style={styles.controlPanel}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Mode Automatique</Text>
          <Switch 
            value={isAuto} 
            onValueChange={onToggleAuto}
            trackColor={{false: "#767577", true: "#81b0ff"}}
            thumbColor={isAuto ? "#667eea" : "#f4f3f4"}
          />
        </View>

        {/* Contrôles Manuels (Cachés si Auto est ON) */}
        {!isAuto && (
          <>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btnCmd, {backgroundColor: '#27ae60'}]} onPress={() => onCommand('open')}>
                <Text style={styles.btnText}>OUVRIR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnCmd, {backgroundColor: '#c0392b'}]} onPress={() => onCommand('close')}>
                <Text style={styles.btnText}>FERMER</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.label}>Ouverture : {windowState?.targetAngle ?? 0}°</Text>
              <Slider
                style={{width: '100%', height: 40}}
                minimumValue={0}
                maximumValue={90}
                step={1}
                value={windowState?.targetAngle ?? 0}
                onSlidingComplete={onAngleChange}
                minimumTrackTintColor="#667eea"
                maximumTrackTintColor="#000000"
                thumbTintColor="#667eea"
              />
            </View>
          </>
        )}
        
        {isAuto && (
          <Text style={styles.hintText}>Désactivez le mode auto pour contrôler.</Text>
        )}
      </View>

      <TouchableOpacity style={styles.btnRefresh} onPress={onRefresh}>
        <Text style={styles.btnText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
  statusTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  infoRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  infoValue: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  controlPanel: { width: '100%', padding: 15, backgroundColor: '#f8f9fa', borderRadius: 10, alignItems: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 15 },
  label: { fontSize: 16, fontWeight: '600', color: '#333' },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 15 },
  btnCmd: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  sliderContainer: { width: '100%', alignItems: 'center', marginVertical: 10 },
  hintText: { fontStyle:'italic', color:'#888', marginTop:10 },
  btnRefresh: { backgroundColor: '#333', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20, width:'100%' },
});

export default DashboardPanel;