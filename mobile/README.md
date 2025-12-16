## Mobile App (React Native - Bare)

### Configuration de l’API (obligatoire pour un téléphone)

L’URL d’API est gérée par `src/config.ts` :
- Si le fichier `mobile/config.json` existe, il est utilisé (non versionné).
- Sinon, valeurs par défaut :
	- Émulateur Android: `http://10.0.2.2:3001`
	- Simulateur iOS: `http://localhost:3001`

Créez votre fichier local pour un appareil physique (remplacez par l’IP de votre PC sur le LAN) :

```json
// mobile/config.json
{
	"apiBaseUrl": "http://192.168.1.50:3001"
}
```

Assurez‑vous que le backend écoute sur le port `3001` et est joignable depuis le téléphone.

### Lancer sur Android

Prérequis: Android SDK/Studio, émulateur en marche ou appareil branché, Node ≥ 20.

```fish
cd mobile
npm start
# Dans un autre terminal :
npm run android
```
