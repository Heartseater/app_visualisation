const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// État global
let windowState = {
  isOpen: false, // État réel rapporté par l'ESP32
  temp: 0,
  aqi: 0,
  lastUpdated: new Date()
};

// Commandes
let currentCommand = 'AUTO'; // 'AUTO' ou 'MANUAL'
let targetAngle = 0;         // Angle souhaité (0 à 90)

app.post('/api/window/log', (req, res) => {
    const { temp, aqi, isOpen } = req.body;
    
    windowState.isOpen = isOpen;
    windowState.temp = temp;
    windowState.aqi = aqi;
    windowState.lastUpdated = new Date();

    console.log(`[ESP32] Temp: ${temp}°C | Angle Cible: ${currentCommand === 'AUTO' ? 'AUTO' : targetAngle}°`);
    
    // On envoie à l'ESP32 le mode ET l'angle précis
    res.json({ 
        success: true, 
        command: currentCommand,
        angle: targetAngle 
    });
});

app.post('/api/window/control', (req, res) => {
    const { action, autoMode, angle } = req.body;

    if (autoMode === true) {
        currentCommand = 'AUTO';
        console.log("📲 App : Mode AUTO activé");
    } 
    else if (autoMode === false) {
        currentCommand = 'MANUAL';
        console.log("📲 App : Mode MANUEL activé (Maintien angle actuel)");
    }
    
    // Si on reçoit un angle précis (Slider)
    if (angle !== undefined) {
        currentCommand = 'MANUAL';
        targetAngle = parseInt(angle);
        console.log(`📲 App : Slider -> ${targetAngle}°`);
    }
    // Gestion des boutons classiques (raccourcis)
    else if (action === 'open') {
        currentCommand = 'MANUAL';
        targetAngle = 90;
        console.log("📲 App : Bouton -> 90°");
    } 
    else if (action === 'close') {
        currentCommand = 'MANUAL';
        targetAngle = 0;
        console.log("📲 App : Bouton -> 0°");
    }

    res.json({ 
        success: true, 
        state: { 
            ...windowState, 
            autoMode: (currentCommand === 'AUTO'),
            targetAngle: targetAngle 
        } 
    });
});

app.get('/api/window/status', (req, res) => {
    res.json({ 
        ...windowState, 
        autoMode: (currentCommand === 'AUTO'),
        targetAngle: targetAngle
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur prêt sur le port ${PORT}`);
});
