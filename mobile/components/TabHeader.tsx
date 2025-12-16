import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TabHeaderProps {
  activeTab: 'SETUP' | 'DASHBOARD';
  onTabChange: (tab: 'SETUP' | 'DASHBOARD') => void;
}

const TabHeader: React.FC<TabHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>🪟 Smart Window</Text>
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
  header: { backgroundColor: '#667eea', paddingTop: 20, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  tabs: { flexDirection: 'row', width: '100%' },
  tab: { flex: 1, padding: 15, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: 'white' },
  tabText: { color: 'white', fontWeight: 'bold' },
});

export default TabHeader;