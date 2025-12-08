/**
 * Smart Window Control System - Mobile App
 * Permet de configurer l'ESP32 via Bluetooth et de voir l'état via le Backend.
 */

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
  RefreshControl
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { encode } from 'base-64';

const API_URL = 'http://10.55.71.14:3001'; 

// UUIDs (Doivent correspondre exactement au code C++ de l'ESP32)
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const bleManager = new BleManager();

function App(): React.JSX.Element {
  // --- Navigation simple (Onglets) ---
  const [tab, setTab] = useState<'SETUP' | 'DASHBOARD'>('SETUP');
  
  // --- State pour le SETUP (Bluetooth) ---
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [lat, setLat] = useState('45.188');
  const [lon, setLon] = useState('5.724');
  const [bleStatus, setBleStatus] = useState('En attente...');
  const [scanning, setScanning] = useState(false);

  // --- State pour le DASHBOARD (HTTP) ---
  const [windowState, setWindowState] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Demander les permissions Android au lancement
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

  // 2. Fonction pour Scanner, Connecter et Configurer l'ESP32
  const scanAndConfigure = () => {
    if (scanning) return; // Évite double clic
    setScanning(true);
    setBleStatus('Recherche ESP32...');

    // On scanne pendant 10 secondes max
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setBleStatus('Erreur Scan: ' + error.message);
        setScanning(false);
        return;
      }

      // Si on trouve notre appareil
      if (device && (device.name === 'ESP32_SmartWindow' || device.localName === 'ESP32_SmartWindow')) {
        bleManager.stopDeviceScan();
        setBleStatus('ESP32 Trouvé ! Connexion...');
        
        device.connect()
          .then((d) => {
            setBleStatus('Découverte des services...');
            return d.discoverAllServicesAndCharacteristics();
          })
          .then((d) => {
            setBleStatus('Envoi de la config...');
            // Format CSV simple : SSID;PASS;LAT;LON
            const configStr = `${ssid};${password};${lat};${lon}`;
            const base64Data = encode(configStr);
            
            return d.writeCharacteristicWithResponseForService(SERVICE_UUID, CHAR_UUID, base64Data);
          })
          .then(() => {
            setBleStatus('Config envoyée ! ✅');
            Alert.alert("Succès", "Configuration envoyée ! L'ESP32 va redémarrer et se connecter au WiFi.");
            setScanning(false);
            // On bascule automatiquement sur le dashboard
            setTimeout(() => setTab('DASHBOARD'), 2000);
          })
          .catch((e) => {
            setBleStatus('Erreur connexion: ' + e.message);
            console.log(e);
            setScanning(false);
          });
      }
    });

    // Timeout de sécurité après 10s
    setTimeout(() => {
        if(scanning) {
            bleManager.stopDeviceScan();
            setScanning(false);
            setBleStatus('Timeout: Aucun ESP32 trouvé. Vérifiez qu\'il est allumé.');
        }
    }, 10000);
  };

  // 3. Fonction pour récupérer l'état de la fenêtre depuis le Backend
  const fetchStatus = async () => {
    setRefreshing(true);
    try {
        console.log(`Appel API vers: ${API_URL}/api/window/status`);
        const res = await fetch(`${API_URL}/api/window/status`);
        const data = await res.json();
        setWindowState(data);
    } catch (e) {
        console.log("Erreur API:", e);
        Alert.alert("Erreur Serveur", "Impossible de joindre le backend. Vérifiez l'IP dans App.tsx et que 'npm start' tourne.");
    } finally {
        setRefreshing(false);
    }
  };

  // Charger le statut quand on arrive sur l'onglet Dashboard
  useEffect(() => {
      if (tab === 'DASHBOARD') {
          fetchStatus();
      }
  }, [tab]);

  // --- INTERFACE GRAPHIQUE ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🪟 Smart Window</Text>
        <View style={styles.tabs}>
            <TouchableOpacity onPress={() => setTab('SETUP')} style={[styles.tab, tab==='SETUP' && styles.activeTab]}>
                <Text style={styles.tabText}>📡 1. Configuration</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('DASHBOARD')} style={[styles.tab, tab==='DASHBOARD' && styles.activeTab]}>
                <Text style={styles.tabText}>📊 2. Dashboard</Text>
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* --- ONGLET 1 : CONFIGURATION (BLE) --- */}
        {tab === 'SETUP' && (
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Configuration WiFi & Localisation</Text>
                <Text style={styles.subText}>Renseignez vos identifiants WiFi pour que l'ESP32 puisse se connecter à Internet.</Text>
                
                <Text style={styles.label}>Nom du WiFi (SSID)</Text>
                <TextInput 
                    style={styles.input} 
                    value={ssid} 
                    onChangeText={setSsid} 
                    placeholder="Ex: Livebox-1234"
                    autoCapitalize="none"
                />
                
                <Text style={styles.label}>Mot de passe WiFi</Text>
                <TextInput 
                    style={styles.input} 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry 
                    placeholder="******"
                />

                <View style={{flexDirection:'row', gap:10}}>
                    <View style={{flex:1}}>
                        <Text style={styles.label}>Latitude</Text>
                        <TextInput style={styles.input} value={lat} onChangeText={setLat} keyboardType="numeric"/>
                    </View>
                    <View style={{flex:1}}>
                        <Text style={styles.label}>Longitude</Text>
                        <TextInput style={styles.input} value={lon} onChangeText={setLon} keyboardType="numeric"/>
                    </View>
                </View>

                <View style={styles.statusBox}>
                    <Text style={{fontWeight:'bold', color: '#333'}}>État : {bleStatus}</Text>
                    {scanning && <ActivityIndicator color="#667eea" />}
                </View>

                <TouchableOpacity 
                    style={[styles.btnAction, scanning && {opacity: 0.7}]} 
                    onPress={scanAndConfigure}
                    disabled={scanning}
                >
                    <Text style={styles.btnText}>{scanning ? 'Recherche en cours...' : '📲 ENVOYER A L\'ESP32'}</Text>
                </TouchableOpacity>
            </View>
        )}

        {/* --- ONGLET 2 : DASHBOARD (HTTP) --- */}
        {tab === 'DASHBOARD' && (
            <View>
                <View style={[styles.card, {alignItems:'center'}]}>
                    <Text style={styles.sectionTitle}>État actuel</Text>
                    
                    {/* Icône Géante */}
                    <Text style={{fontSize: 80, marginVertical: 20}}>
                        {windowState?.isOpen ? '🪟' : '🚪'}
                    </Text>
                    
                    {/* Texte État */}
                    <Text style={[styles.statusText, {color: windowState?.isOpen ? 'green' : '#d63031'}]}>
                        {windowState?.isOpen ? 'OUVERTE' : 'FERMÉE'}
                    </Text>

                    {/* Données Météo reçues du Backend */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>🌡️ Temp</Text>
                            <Text style={styles.infoValue}>{windowState?.temp ? windowState.temp + '°C' : '--'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>🏭 Pollution</Text>
                            <Text style={styles.infoValue}>{windowState?.aqi ? 'AQI ' + windowState.aqi : '--'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.btnRefresh} onPress={fetchStatus}>
                        <Text style={styles.btnText}>Actualiser</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Dernière synchronisation</Text>
                    <Text style={{color:'#555'}}>
                        {windowState?.lastUpdated ? new Date(windowState.lastUpdated).toLocaleTimeString() : 'Jamais'}
                    </Text>
                    <Text style={{color:'#888', marginTop:10, fontStyle:'italic', fontSize: 12}}>
                        Le système se met à jour automatiquement toutes les 30 secondes via l'ESP32.
                    </Text>
                </View>
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#667eea', paddingTop: 20, paddingBottom: 0, alignItems: 'center', elevation: 4 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  tabs: { flexDirection: 'row', width: '100%' },
  tab: { flex: 1, padding: 15, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: 'white' },
  tabText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  content: { padding: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset:{width:0, height:2}, shadowOpacity:0.1, shadowRadius:4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  subText: { color: '#666', marginBottom: 20, fontSize: 13 },
  label: { fontWeight: '600', marginBottom: 5, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: '#fafafa', color: '#333' },
  statusBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: 12, backgroundColor: '#eef', borderRadius: 8, borderWidth: 1, borderColor: '#dde' },
  btnAction: { backgroundColor: '#667eea', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnRefresh: { backgroundColor: '#333', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20, width:'100%' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  statusText: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  infoRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginVertical: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: 'bold', color: '#333' }
});

export default App;
