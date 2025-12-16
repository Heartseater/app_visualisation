import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TabHeaderProps {
  activeTab: 'SETUP' | 'DASHBOARD';
  onTabChange: (tab: 'SETUP' | 'DASHBOARD') => void;
}

const TabHeader: React.FC<TabHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>𖣘 Smart VMC</Text>
      <View style={styles.tabs}>
        <TouchableOpacity 
          onPress={() => onTabChange('SETUP')} 
          style={[styles.tab, activeTab === 'SETUP' && styles.activeTab]}
        >
          <Text style={styles.tabText}>📡 Setup</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => onTabChange('DASHBOARD')} 
          style={[styles.tab, activeTab === 'DASHBOARD' && styles.activeTab]}
        >
          <Text style={styles.tabText}>📊 Contrôle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    // Vert "ENSIMAG" (profond et professionnel)
    backgroundColor: '#007A5E', 
    paddingTop: 50, // Plus d'espace pour la barre d'état (encoche)
    paddingBottom: 10,
    alignItems: 'center',
    // Ombre portée douce pour donner du relief (iOS & Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700', // Un gras un peu moins lourd que 'bold'
    letterSpacing: 0.8, // Espacement léger pour la modernité
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    width: '90%', // Les onglets ne collent pas aux bords
    justifyContent: 'space-between',
    paddingBottom: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20, // Onglets en forme de pilule si activés
  },
  activeTab: {
    // Fond blanc translucide pour l'onglet actif (style "glassmorphism")
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    color: '#FFF', // Blanc un peu transparent par défaut
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF', // Blanc pur pour l'actif
    fontWeight: 'bold',
  }
});

export default TabHeader;