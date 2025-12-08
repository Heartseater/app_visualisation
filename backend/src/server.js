const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// État global de la fenêtre
let windowState = {
  isOpen: false,
  temp: 0,
  aqi: 0,
  lastUpdated: new Date()
};

// Route pour recevoir les infos de l'ESP32
app.post('/api/window/log', (req, res) => {
    const { temp, aqi, isOpen } = req.body;
    
    // Mise à jour des variables
    windowState.isOpen = isOpen;
    windowState.temp = temp;
    windowState.aqi = aqi;
    windowState.lastUpdated = new Date();

    console.log(`[ESP32] Reçu -> Temp: ${temp}°C, Pollution: ${aqi}, Fenêtre: ${isOpen ? 'OUVERTE' : 'FERMÉE'}`);
    res.json({ success: true });
});

// Route pour l'App Mobile
app.get('/api/window/status', (req, res) => {
    res.json(windowState);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur prêt sur le port ${PORT}`);
});
