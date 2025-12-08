import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Switch
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { encode } from 'base-64';

const API_URL = 'http://10.55.71.14:3001'; 

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const bleManager = new BleManager();

function App(): React.JSX.Element {
  const [tab, setTab] = useState<'SETUP' | 'DASHBOARD'>('SETUP');
  
  // Setup BLE
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [lat, setLat] = useState('45.188');
  const [lon, setLon] = useState('5.724');
  const [bleStatus, setBleStatus] = useState('En attente...');
  const [scanning, setScanning] = useState(false);

  // Dashboard Data
  const [windowState, setWindowState] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    }
  };

  useEffect(() => { requestPermissions(); }, []);

  // --- LOGIQUE BLE (Configuration) ---
  const scanAndConfigure = () => {
    if (scanning) return;
    setScanning(true);
    setBleStatus('Recherche ESP32...');

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setBleStatus('Erreur Scan: ' + error.message);
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
            const configStr = `${ssid};${password};${lat};${lon}`;
            return d.writeCharacteristicWithResponseForService(SERVICE_UUID, CHAR_UUID, encode(configStr));
          })
          .then(() => handleSuccess())
          .catch(() => handleSuccess()); // On force le succès même si l'ESP reboot
      }
    });

    const handleSuccess = () => {
        setBleStatus('Config envoyée ! ✅');
        setScanning(false);
        Alert.alert("Succès", "L'ESP32 redémarre...");
        setTimeout(() => { setTab('DASHBOARD'); fetchStatus(); }, 1000);
    };

    setTimeout(() => { if(scanning) { bleManager.stopDeviceScan(); setScanning(false); setBleStatus('Timeout'); } }, 15000);
  };

  // --- LOGIQUE DASHBOARD (API HTTP) ---
  const fetchStatus = async () => {
    setRefreshing(true);
    try {
        const res = await fetch(`${API_URL}/api/window/status`);
        const data = await res.json();
        setWindowState(data);
    } catch (e) {
        console.log("Erreur API", e);
    } finally {
        setRefreshing(false);
    }
  };

  const sendCommand = async (action: 'open' | 'close') => {
      try {
          await fetch(`${API_URL}/api/window/control`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ action, autoMode: false })
          });
          fetchStatus(); // Mise à jour immédiate
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

  useEffect(() => { if (tab === 'DASHBOARD') fetchStatus(); }, [tab]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🪟 Smart Window</Text>
        <View style={styles.tabs}>
            <TouchableOpacity onPress={() => setTab('SETUP')} style={[styles.tab, tab==='SETUP' && styles.activeTab]}><Text style={styles.tabText}>📡 Setup</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('DASHBOARD')} style={[styles.tab, tab==='DASHBOARD' && styles.activeTab]}><Text style={styles.tabText}>📊 Contrôle</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'SETUP' && (
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Configuration WiFi</Text>
                <TextInput style={styles.input} value={ssid} onChangeText={setSsid} placeholder="SSID WiFi" autoCapitalize='none'/>
                <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Mot de passe"/>
                <View style={{flexDirection:'row', gap:10}}>
                    <TextInput style={[styles.input, {flex:1}]} value={lat} onChangeText={setLat} placeholder="Lat" keyboardType='numeric'/>
                    <TextInput style={[styles.input, {flex:1}]} value={lon} onChangeText={setLon} placeholder="Lon" keyboardType='numeric'/>
                </View>
                <Text style={{marginBottom:10, textAlign:'center'}}>{bleStatus}</Text>
                <TouchableOpacity style={styles.btnAction} onPress={scanAndConfigure} disabled={scanning}>
                    <Text style={styles.btnText}>{scanning ? '...' : 'ENVOYER CONFIG'}</Text>
                </TouchableOpacity>
            </View>
        )}

        {tab === 'DASHBOARD' && (
            <View>
                <View style={[styles.card, {alignItems:'center'}]}>
                    <Text style={{fontSize: 80}}>{windowState?.isOpen ? '🪟' : '🚪'}</Text>
                    <Text style={[styles.statusText, {color: windowState?.isOpen ? 'green' : '#d63031'}]}>
                        {windowState?.isOpen ? 'OUVERTE' : 'FERMÉE'}
                    </Text>

                    {/* Données Météo */}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoValue}>🌡️ {windowState?.temp}°C</Text>
                        <Text style={styles.infoValue}>🏭 AQI {windowState?.aqi}</Text>
                    </View>

                    {/* --- NOUVEAU : CONTRÔLES --- */}
                    <View style={styles.controlPanel}>
                        <View style={styles.switchRow}>
                            <Text style={styles.label}>Mode Automatique</Text>
                            <Switch 
                                value={windowState?.autoMode ?? true} 
                                onValueChange={toggleAutoMode}
                                trackColor={{false: "#767577", true: "#81b0ff"}}
                                thumbColor={windowState?.autoMode ? "#667eea" : "#f4f3f4"}
                            />
                        </View>

                        {/* Les boutons ne s'affichent que si le mode Auto est OFF */}
                        {!windowState?.autoMode && (
                            <View style={styles.btnRow}>
                                <TouchableOpacity style={[styles.btnCmd, {backgroundColor: '#27ae60'}]} onPress={() => sendCommand('open')}>
                                    <Text style={styles.btnText}>OUVRIR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btnCmd, {backgroundColor: '#c0392b'}]} onPress={() => sendCommand('close')}>
                                    <Text style={styles.btnText}>FERMER</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        
                        {windowState?.autoMode && (
                            <Text style={{fontStyle:'italic', color:'#888', marginTop:10}}>Désactivez le mode auto pour contrôler.</Text>
                        )}
                    </View>

                    <TouchableOpacity style={styles.btnRefresh} onPress={fetchStatus}>
                        <Text style={styles.btnText}>Actualiser</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#667eea', paddingTop: 20, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  tabs: { flexDirection: 'row', width: '100%' },
  tab: { flex: 1, padding: 15, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: 'white' },
  tabText: { color: 'white', fontWeight: 'bold' },
  content: { padding: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: '#fafafa', color:'black' },
  btnAction: { backgroundColor: '#667eea', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnRefresh: { backgroundColor: '#333', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20, width:'100%' },
  btnText: { color: 'white', fontWeight: 'bold' },
  statusText: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  infoRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  infoValue: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  
  // Nouveaux Styles pour le panneau de contrôle
  controlPanel: { width: '100%', padding: 15, backgroundColor: '#f8f9fa', borderRadius: 10, alignItems: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 15 },
  label: { fontSize: 16, fontWeight: '600', color: '#333' },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  btnCmd: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' }
});

export default App;
