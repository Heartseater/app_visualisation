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
        placeholderTextColor={'#A0A0A0'}
      />
      <TextInput 
        style={styles.input} 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        placeholder="Mot de passe"
        placeholderTextColor={'#A0A0A0'}
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
  // CARD : Plus arrondie et avec une ombre similaire au header
  card: {
    backgroundColor: 'white',
    padding: 24, // Un peu plus d'espace intérieur (aéré)
    borderRadius: 16, // Plus arrondi pour matcher le style moderne
    marginBottom: 20,
    // Ombre douce cohérente avec le header
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4, 
  },

  // TITRE : On utilise la couleur primaire pour rappeler la marque
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700', // Match le headerTitle
    marginBottom: 15,
    color: '#007A5E', // Rappel du vert ENSIMAG
    letterSpacing: 0.5,
  },

  // INPUT : Plus doux, fond gris très clair pour contraster avec la carte blanche
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0', // Bordure plus subtile
    borderRadius: 12, // Arrondi cohérent
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F9FAFB', // Fond très légèrement grisé (moderne)
    color: '#333',
  },

  // TEXTE SECONDAIRE
  statusText: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },

  // BOUTON : Le point focal, reprend exactement le style du Header
  btnAction: {
    backgroundColor: '#007A5E', // Vert ENSIMAG
    paddingVertical: 16,
    borderRadius: 12, // Match les inputs et la card
    alignItems: 'center',
    // Petite ombre pour que le bouton "ressorte"
    shadowColor: '#007A5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },

  btnText: {
    color: 'white',
    fontWeight: '700', // Gras pour la lisibilité
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default SetupPanel;