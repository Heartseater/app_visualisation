import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { encode } from 'base-64';

// Import des composants
import TabHeader from './components/TabHeader';
import SetupPanel from './components/SetupPanel';
import DashboardPanel, { WindowState } from './components/DashboardPanel';

const API_URL = 'http://10.166.120.14:3001'; 
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const bleManager = new BleManager();

function App(): React.JSX.Element {
  const [tab, setTab] = useState<'SETUP' | 'DASHBOARD'>('SETUP');
  
  // États BLE
  const [bleStatus, setBleStatus] = useState('En attente...');
  const [scanning, setScanning] = useState(false);

  // États Dashboard
  const [windowState, setWindowState] = useState<WindowState | null>(null);

  // --- 1. PERMISSIONS ---
  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    }
  }, []);

  // --- 2. LOGIQUE API HTTP ---
  const fetchStatus = async () => {
    try {
        const res = await fetch(`${API_URL}/api/window/status`);
        const data = await res.json();
        setWindowState(data);
    } catch (e) {
        console.log("Erreur API", e);
    }
  };

  const sendAngle = async (val: number) => {
    const angleInt = Math.round(val);
    try {
        await fetch(`${API_URL}/api/window/control`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ angle: angleInt, autoMode: false })
        });
        // Optimiste update ou fetchStatus après délai
    } catch (e) { console.log(e); }
  };
  
  const sendCommand = async (action: 'open' | 'close') => {
      try {
          await fetch(`${API_URL}/api/window/control`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ action, autoMode: false })
          });
          fetchStatus();
      } catch (e) { Alert.alert("Erreur", "Impossible d'envoyer la commande"); }
  };

  const toggleAutoMode = async (value: boolean) => {
      try {
          await fetch(`${API_URL}/api/window/control`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ autoMode: value })
          });
          fetchStatus();
      } catch (e) { Alert.alert("Erreur", "Erreur réseau"); }
  };

  // Chargement initial quand on arrive sur le dashboard
  useEffect(() => { if (tab === 'DASHBOARD') fetchStatus(); }, [tab]);


  // --- 3. LOGIQUE BLE ---
  const scanAndConfigure = (ssid: string, pass: string, lat: string, lon: string) => {
    if (scanning) return;
    setScanning(true);
    setBleStatus('Recherche ESP32...');

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setBleStatus('Erreur: ' + error.message);
        setScanning(false);
        return;
      }

      if (device && (device.name === 'ESP32_SmartWindow' || device.localName === 'ESP32_SmartWindow')) {
        bleManager.stopDeviceScan();
        setBleStatus('Connexion...');
        
        device.connect()
          .then((d) => d.discoverAllServicesAndCharacteristics())
          .then((d) => {
            setBleStatus('Envoi Config...');
            const configStr = `${ssid};${pass};${lat};${lon}`;
            return d.writeCharacteristicWithResponseForService(SERVICE_UUID, CHAR_UUID, encode(configStr));
          })
          .then(() => handleSuccess())
          .catch(() => handleSuccess());
      }
    });

    const handleSuccess = () => {
        setBleStatus('Config envoyée ! ✅');
        setScanning(false);
        Alert.alert("Succès", "L'ESP32 redémarre...");
        setTimeout(() => { setTab('DASHBOARD'); fetchStatus(); }, 1000);
    };

    // Timeout de sécurité
    setTimeout(() => { 
        if(scanning) { 
            bleManager.stopDeviceScan(); 
            setScanning(false); 
            setBleStatus('Timeout (Aucun appareil trouvé)'); 
        } 
    }, 15000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <TabHeader activeTab={tab} onTabChange={setTab} />

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'SETUP' && (
            <SetupPanel 
                bleStatus={bleStatus}
                isScanning={scanning}
                onConnect={scanAndConfigure}
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