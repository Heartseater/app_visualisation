import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { AppButton } from '../ui/AppButton'; // Ton bouton générique

interface ControlPanelProps {
  isAuto: boolean;
  targetAngle: number;
  onToggleAuto: (value: boolean) => void;
  onCommand: (action: 'open' | 'close') => void;
  onAngleChange: (angle: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isAuto,
  targetAngle,
  onToggleAuto,
  onCommand,
  onAngleChange
}) => {
  return (
    <View style={styles.container}>
      {/* Switch Row */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Mode Automatique</Text>
        <Switch 
          value={isAuto} 
          onValueChange={onToggleAuto}
          trackColor={{ false: "#D1D5DB", true: "#007A5E" }}    
          thumbColor={isAuto ? "#FFFFFF" : "#f4f3f4"}
          ios_backgroundColor="#D1D5DB"
        />
      </View>

      {/* Manual Controls */}
      {!isAuto ? (
        <>
          <View style={styles.btnRow}>
            <AppButton 
              title="OUVRIR" 
              variant="primary" 
              style={{flex: 1}} 
              onPress={() => onCommand('open')} 
            />
            <AppButton 
              title="FERMER" 
              variant="danger" 
              style={{flex: 1}} 
              onPress={() => onCommand('close')} 
            />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.label}>Ouverture : {targetAngle}°</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={0}
              maximumValue={90}
              step={1}
              value={targetAngle}
              onSlidingComplete={onAngleChange}
              minimumTrackTintColor="#007A5E"
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor="#007A5E"
            />
          </View>
        </>
      ) : (
        <Text style={styles.hintText}>
          Désactivez le mode auto pour contrôler manuellement.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  sliderContainer: {
    width: '100%',
    marginVertical: 10,
  },
  hintText: {
    fontStyle: 'italic',
    color: '#9CA3AF',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
});