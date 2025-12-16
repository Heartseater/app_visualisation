import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';

// Hooks Personnalisés
import { useBLE } from './hooks/useBLE';
import { useWindowApi } from './hooks/useWindowApi';

// Composants
import TabHeader from './components/TabHeader';
import SetupPanel from './components/SetupPanel';
import DashboardPanel from './components/DashboardPanel';

function App(): React.JSX.Element {
  // Navigation
  const [tab, setTab] = useState<'SETUP' | 'DASHBOARD'>('SETUP');
  
  // Utilisation des Hooks
  const { bleStatus, isScanning, scanAndConfigure } = useBLE();
  const { windowState, fetchStatus, sendCommand, sendAngle, toggleAutoMode } = useWindowApi();

  // Rafraîchir les données quand on arrive sur le Dashboard
  useEffect(() => { 
    if (tab === 'DASHBOARD') {
        fetchStatus();
    }
  }, [tab, fetchStatus]);

  const handleConnect = (ssid: string, pass: string, lat: string, lon: string) => {
    scanAndConfigure(ssid, pass, lat, lon, () => {
        setTab('DASHBOARD');
        fetchStatus();
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <StatusBar barStyle="light-content" backgroundColor="#007A5E" />
      
      <TabHeader activeTab={tab} onTabChange={setTab} />

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'SETUP' && (
            <SetupPanel 
                bleStatus={bleStatus}
                isScanning={isScanning}
                onConnect={handleConnect}
            />
        )}

        {tab === 'DASHBOARD' && (
            <DashboardPanel 
                windowState={windowState}
                onRefresh={fetchStatus}
                onToggleAuto={toggleAutoMode}
                onCommand={sendCommand}
                onAngleChange={sendAngle}
            />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { padding: 20 },
});

export default App;