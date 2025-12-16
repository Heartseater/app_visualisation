import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export interface WindowState {
  isOpen: boolean;
  temp: number;
  aqi: number;
  targetAngle: number;
  autoMode: boolean;
}

const API_URL = 'http://10.166.120.14:3001'; 

export const useWindowApi = () => {
  const [windowState, setWindowState] = useState<WindowState | null>(null);

  // Récupérer l'état
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/window/status`);
      const data = await res.json();
      
      setWindowState(data);
    } catch (e) {
      console.log("Erreur API fetchStatus", e);
    }
  }, []);

  // Envoyer une commande (Ouvrir/Fermer)
  const sendCommand = useCallback(async (action: 'open' | 'close') => {
    try {
      const res = await fetch(`${API_URL}/api/window/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, autoMode: false })
      });
      
      const data = await res.json();
      
      if (data.success && data.state) {
        setWindowState(data.state);
      } else {
        fetchStatus();
      }
      
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'envoyer la commande");
    }
  }, [fetchStatus]);

  // Changer l'angle (Slider)
  const sendAngle = useCallback(async (val: number) => {
    const angleInt = Math.round(val);
    try {
      const res = await fetch(`${API_URL}/api/window/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ angle: angleInt, autoMode: false })
      });
      
      const data = await res.json();
      if (data.success && data.state) {
        setWindowState(data.state);
      }

    } catch (e) {
      console.log(e);
    }
  }, []);

  // Activer/Désactiver le mode Auto
  const toggleAutoMode = useCallback(async (value: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/window/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoMode: value })
      });
      
      const data = await res.json();
      if (data.success && data.state) {
        setWindowState(data.state);
      } else {
        fetchStatus();
      }

    } catch (e) {
      Alert.alert("Erreur", "Erreur réseau");
    }
  }, [fetchStatus]);

  return {
    windowState,
    fetchStatus,
    sendCommand,
    sendAngle,
    toggleAutoMode
  };
};