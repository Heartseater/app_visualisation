import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// Import des nouveaux composants
import { Card } from './ui/Card';
import { AppInput } from './ui/AppInput';
import { AppButton } from './ui/AppButton';

interface SetupPanelProps {
  bleStatus: string;
  isScanning: boolean;
  onConnect: (ssid: string, pass: string, lat: string, lon: string) => void;
}

const SetupPanel: React.FC<SetupPanelProps> = ({ bleStatus, isScanning, onConnect }) => {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [lat, setLat] = useState('45.188');
  const [lon, setLon] = useState('5.724');

  return (
    <Card>
      <Text style={styles.sectionTitle}>Configuration WiFi</Text>
      
      <AppInput 
        value={ssid} 
        onChangeText={setSsid} 
        placeholder="SSID WiFi" 
        autoCapitalize='none'
      />
      <AppInput 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        placeholder="Mot de passe"
      />
      
      <View style={{flexDirection:'row', gap:10}}>
        <AppInput 
          style={{flex:1}} 
          value={lat} 
          onChangeText={setLat} 
          placeholder="Lat" 
          keyboardType='numeric'
        />
        <AppInput 
          style={{flex:1}} 
          value={lon} 
          onChangeText={setLon} 
          placeholder="Lon" 
          keyboardType='numeric'
        />
      </View>

      <Text style={styles.statusText}>{bleStatus}</Text>
      
      <AppButton 
        title={isScanning ? 'RECHERCHE...' : 'ENVOYER CONFIG'}
        onPress={() => onConnect(ssid, password, lat, lon)}
        isLoading={isScanning}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    color: '#007A5E',
  },
  statusText: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});

export default SetupPanel;