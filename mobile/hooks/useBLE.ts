import { useState, useEffect, useMemo } from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { encode } from 'base-64';

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

export const useBLE = () => {
  
  const bleManager = useMemo(() => new BleManager(), []);
  
  const [bleStatus, setBleStatus] = useState('En attente...');
  const [isScanning, setIsScanning] = useState(false);

  // Gestion des permissions au montage du hook
  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    }
    
    return () => {
      bleManager.destroy();
    };
  }, [bleManager]);

  // Scanner et configurer l'ESP32
  const scanAndConfigure = (
    ssid: string, 
    pass: string, 
    lat: string, 
    lon: string,
    onSuccess: () => void
  ) => {
    if (isScanning) return;
    
    setIsScanning(true);
    setBleStatus('Recherche ESP32...');

    
    const scanTimeout = setTimeout(() => { 
        if (isScanning) { 
            bleManager.stopDeviceScan(); 
            setIsScanning(false); 
            setBleStatus('Timeout (Aucun appareil trouvé)'); 
        } 
    }, 15000);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setBleStatus('Erreur: ' + error.message);
        setIsScanning(false);
        clearTimeout(scanTimeout);
        return;
      }

      if (device && (device.name === 'ESP32_SmartWindow' || device.localName === 'ESP32_SmartWindow')) {
        bleManager.stopDeviceScan();
        clearTimeout(scanTimeout);
        setBleStatus('Connexion...');
        
        device.connect()
          .then((d) => d.discoverAllServicesAndCharacteristics())
          .then((d) => {
            setBleStatus('Envoi Config...');
            const configStr = `${ssid};${pass};${lat};${lon}`;
            return d.writeCharacteristicWithResponseForService(SERVICE_UUID, CHAR_UUID, encode(configStr));
          })
          .then(() => {
            setBleStatus('Config envoyée ! ✅');
            setIsScanning(false);
            Alert.alert("Succès", "L'ESP32 redémarre...");
            
            
            setTimeout(() => {
                onSuccess();
            }, 1000);
          })
          .catch((err) => {
             setBleStatus('Erreur écriture: ' + err.message);
             setIsScanning(false);
          });
      }
    });
  };

  return {
    bleStatus,
    isScanning,
    scanAndConfigure
  };
};