const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// État global
let windowState = {
  isOpen: false,
  temp: 0,
  aqi: 0,
  lastUpdated: new Date()
};

// Variable pour stocker l'ordre manuel : 'AUTO', 'OPEN', ou 'CLOSE'
let currentCommand = 'AUTO';

// 1. L'ESP32 envoie ses logs ET reçoit l'ordre en réponse
app.post('/api/window/log', (req, res) => {
    const { temp, aqi, isOpen } = req.body;
    
    // On met à jour l'état vu par le dashboard
    windowState.isOpen = isOpen;
    windowState.temp = temp;
    windowState.aqi = aqi;
    windowState.lastUpdated = new Date();

    console.log(`[ESP32] Reçu: ${temp}°C | État actuel: ${isOpen?'OUVERT':'FERMÉ'} | Ordre envoyé: ${currentCommand}`);
    
    // C'est ICI la magie : on répond à l'ESP32 avec l'ordre actuel
    res.json({ 
        success: true, 
        command: currentCommand 
    });
});

// 2. L'App Mobile envoie un ordre manuel
app.post('/api/window/control', (req, res) => {
    const { action, autoMode } = req.body;

    // PRIORITÉ 1 : Si une action explicite (Ouvrir/Fermer) est envoyée
    if (action === 'open') {
        currentCommand = 'OPEN';
        console.log("📲 App : Action -> Force OUVERTURE");
    } 
    else if (action === 'close') {
        currentCommand = 'CLOSE';
        console.log("📲 App : Action -> Force FERMETURE");
    }
    // PRIORITÉ 2 : Si pas d'action, on regarde le changement de mode
    else if (autoMode === true) {
        currentCommand = 'AUTO';
        console.log("📲 App : Switch -> Mode AUTO");
    } 
    else if (autoMode === false) {
        // On désactive juste le mode auto, on garde la position actuelle
        currentCommand = windowState.isOpen ? 'OPEN' : 'CLOSE';
        console.log("📲 App : Switch -> Mode MANUEL (Maintien position)");
    }

    res.json({ 
        success: true, 
        state: { ...windowState, autoMode: (currentCommand === 'AUTO') } 
    });
});

// 3. L'App Mobile récupère l'état pour l'affichage
app.get('/api/window/status', (req, res) => {
    res.json({ 
        ...windowState, 
        autoMode: (currentCommand === 'AUTO') 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur prêt sur le port ${PORT}`);
});
