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
        <Text style={{ fontSize: 80, marginBottom: 10 }}>
        {isOpen ? '💨' : '🚫'}
        </Text>
        <Text style={[
            styles.statusTitle, 
            { color: isOpen ? '#007A5E' : '#EF4444' }
            ]}>
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
            trackColor={{ false: "#D1D5DB", true: "#007A5E" }}    
            thumbColor={isAuto ? "#FFFFFF" : "#f4f3f4"}
            />
        </View>

        {/* Contrôles Manuels (Cachés si Auto est ON) */}
        {!isAuto && (
          <>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btnCmd, {backgroundColor: '#27ae60'}]} onPress={() => onCommand('open')}>
                <Text style={styles.btnText}>OUVRIR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnCmd, {backgroundColor: '#EF4444'}]} onPress={() => onCommand('close')}>
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
                minimumTrackTintColor="#007A5E"
                maximumTrackTintColor="#D1D5DB"
                thumbTintColor="#007A5E"
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
  // CARD : Base identique à l'écran précédent (cohérence globale)
  card: {
    backgroundColor: 'white',
    padding: 24, // Espacement interne confortable
    borderRadius: 16, // Arrondis modernes
    marginBottom: 20,
    // Ombre douce
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  // TITRE DE STATUT : Gros, centré et aux couleurs de l'école
  statusTitle: {
    fontSize: 28,
    fontWeight: '800', // Très gras pour l'impact
    marginBottom: 25,
    color: '#007A5E', // Vert ENSIMAG
    textAlign: 'center', // Souvent mieux centré pour un statut principal
    letterSpacing: 0.5,
  },

  // LIGNE D'INFO : Plus aérée
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Centré pour l'équilibre
    gap: 20, // Utilise la propriété gap (moderne)
    marginBottom: 25,
  },
  
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151', // Gris foncé (Gray-700) plutôt que #555 pour le contraste
  },

  // ZONE DE CONTRÔLE (Le fond gris)
  controlPanel: {
    width: '100%',
    padding: 20,
    backgroundColor: '#F9FAFB', // Le même gris très clair que tes inputs
    borderRadius: 12, // Cohérence avec les inputs/boutons
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6', // Bordure très subtile pour délimiter
  },

  // SWITCH / LABEL
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5, // Petit retrait pour aligner avec le texte
  },
  
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937', // Gris presque noir pour la lisibilité
  },

  // BOUTONS DE COMMANDE (Cote à cote)
  btnRow: {
    flexDirection: 'row',
    gap: 12, // Espace entre les boutons
    width: '100%',
    marginBottom: 20,
  },
  
  btnCmd: {
    flex: 1,
    paddingVertical: 14, // Hauteur tactile confortable
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007A5E', // Vert par défaut (tu peux surcharger pour le bouton "OFF")
    // Ombre colorée (Glow effect)
    shadowColor: '#007A5E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  btnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },

  // SLIDER
  sliderContainer: {
    width: '100%',
    alignItems: 'stretch', // Pour que le slider prenne la largeur
    marginVertical: 15,
  },

  hintText: {
    fontStyle: 'italic',
    color: '#9CA3AF', // Gris moyen (Cool Gray)
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },

  // BOUTON REFRESH (Secondaire)
  btnRefresh: {
    backgroundColor: '#374151', // Gris anthracite (Dark Slate) pour différencier du vert
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    // Ombre plus discrète
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default DashboardPanel;