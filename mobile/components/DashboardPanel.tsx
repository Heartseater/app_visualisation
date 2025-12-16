import React from 'react';
import { StyleSheet } from 'react-native';

// UI Components
import { Card } from './ui/Card';
import { AppButton } from './ui/AppButton';

// Dashboard Sub-components
import { StatusDisplay } from './dashboard/StatusDisplay';
import { SensorRow } from './dashboard/SensorRow';
import { ControlPanel } from './dashboard/ControlPanel';

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
  
  // Valeurs par défaut sécurisées
  const isOpen = windowState?.isOpen ?? false;
  const isAuto = windowState?.autoMode ?? true;
  const targetAngle = windowState?.targetAngle ?? 0;

  return (
    <Card style={styles.container}>
      
      {/* 1. État Visuel */}
      <StatusDisplay isOpen={isOpen} />

      {/* 2. Capteurs */}
      <SensorRow 
        temp={windowState?.temp} 
        aqi={windowState?.aqi} 
      />

      {/* 3. Panneau de Contrôle */}
      <ControlPanel 
        isAuto={isAuto}
        targetAngle={targetAngle}
        onToggleAuto={onToggleAuto}
        onCommand={onCommand}
        onAngleChange={onAngleChange}
      />

      {/* 4. Action Secondaire */}
      <AppButton 
        title="Actualiser" 
        variant="outline" 
        style={styles.refreshBtn}
        onPress={onRefresh}
      />

    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center', // Centre tout le contenu de la carte
  },
  refreshBtn: {
    width: '100%', 
    marginTop: 20 
  }
});

export default DashboardPanel;