import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface SetupPanelProps {
  bleStatus: string;
  isScanning: boolean;
  onConnect: (ssid: string, pass: string, lat: string, lon: string) => void;
}

const SetupPanel: React.FC<SetupPanelProps> = ({ bleStatus, isScanning, onConnect }) => {
  // État local au formulaire (pas besoin de polluer App.tsx avec ça tant qu'on n'envoie pas)
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [lat, setLat] = useState('45.188');
  const [lon, setLon] = useState('5.724');

  const handlePress = () => {
    onConnect(ssid, password, lat, lon);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Configuration WiFi</Text>
      
      <TextInput 
        style={styles.input} 
        value={ssid} 
        onChangeText={setSsid} 
        placeholder="SSID WiFi" 
        autoCapitalize='none'
      />
      <TextInput 
        style={styles.input} 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        placeholder="Mot de passe"
      />
      
      <View style={{flexDirection:'row', gap:10}}>
        <TextInput 
          style={[styles.input, {flex:1}]} 
          value={lat} 
          onChangeText={setLat} 
          placeholder="Lat" 
          keyboardType='numeric'
        />
        <TextInput 
          style={[styles.input, {flex:1}]} 
          value={lon} 
          onChangeText={setLon} 
          placeholder="Lon" 
          keyboardType='numeric'
        />
      </View>

      <Text style={styles.statusText}>{bleStatus}</Text>
      
      <TouchableOpacity 
        style={styles.btnAction} 
        onPress={handlePress} 
        disabled={isScanning}
      >
        <Text style={styles.btnText}>{isScanning ? '...' : 'ENVOYER CONFIG'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: '#fafafa', color:'black' },
  statusText: { marginBottom: 10, textAlign: 'center', color: '#555' },
  btnAction: { backgroundColor: '#667eea', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
});

export default SetupPanel;