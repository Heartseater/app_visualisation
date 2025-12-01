
# Cahier des charges — Projet Volet Météo + App de Monitoring

**Version** : 1.0

**Date** : [01/12/2025]

**Auteurs** : [Vincent Canaguy, Yahya Er-Rahmaouy, Tayeb Nazim Djeradi, Aladji Kassoum BINI]

---

## 1. Résumé du projet

Notre projet consiste à réaliser un dispositif IoT permettant d'ouvrir ou fermer automatiquement un volet roulant selon les conditions météo (pluie, vent, ensoleillement, pollution) et offrant une application de monitoring et de contrôle manuel pour l'utilisateur.

---

## 2. Contexte et objectifs

- **Contexte** : maison connectée, gain d'énergie, protection contre intempéries
- **Objectifs principaux** :
	- Protéger l'habitation en fermant le volet par mauvais temps.
	- Optimiser l'exposition solaire en ouvrant/fermant selon la luminosité ou l'ensoleillement.
	- Fournir un contrôle manuel et des notifications via une application.

---

## 3. Périmètre

- **Matériel** :
  - moteur
  - carte ESP32
- **Logiciel**: 
    - Firmware embarqué pour actionneur
    - Application mobile/web pour monitoring et contrôle

---

## 4. Acteurs

- **Utilisateur final** : propriétaire / locataire
- **Système (embarqué)** : MCU + actionneurs
- **Application mobile / web** : monitoring et contrôle
- **Service tierce** : APIs météo externes

---

## 5. Exigences fonctionnelles 

- **01 — Récupération des conditions locales**
	- Description : Le système doit pouvoir récupérer la luminosité, la température et la détection pluie/vent via api.
	- Priorité : Haute
	- Critères d'acceptation : Données météo reçues toutes les 10 minutes; logs des valeurs stockés localement et/ou sur cloud.

- **02 — Règles d'ouverture/fermeture automatique**
	- Description : Le volet s'ouvre ou se ferme automatiquement selon des règles configurables (ex : fermer si pluie détectée ou vent > seuil).
	- Priorité : Haute
	- Critères d'acceptation : Scénarios de test montrant que la règle est appliquée correctement; possibilité de forcer manuellement.

- **03 — Contrôle manuel depuis l'app**
	- Description : L'utilisateur peut ouvrir/stop/fermer le volet depuis l'application.
	- Priorité : Haute
	- Critères d'acceptation : Commande envoyée et état mis à jour sous 3 s; remontée d'erreur si indisponible.

- **04 — Mode automatique / manuel**
	- Description : Basculer entre mode automatique (règles météo) et mode manuel.
	- Priorité : Moyenne
	- Critères d'acceptation : L'état du mode est visible et persisté.

- **05 — Notifications**
	- Description : Recevoir notifications en cas d'événement critique (ex : obstruction moteur, échec d'ouverture, conditions extrêmes) et non critiques (ex : changement de mode, ouverture/fermeture).
	- Priorité : Moyenne
	- Critères d'acceptation : Notification reçue sur app et log enregistrés.

- **06 — Historique & Dashboard**
	- Description : Visualiser l'historique des états (ouvert/fermé), mesures météo et interventions manuelles.
	- Priorité : Basse
	- Critères d'acceptation : Graphiques consultables.

- **07 — Sécurité & détection d'obstacle**
	- Description : Arrêt immédiat et inversion si obstacle détecté lors du mouvement.
	- Priorité : Critique
	- Critères d'acceptation : Test d'obstruction arrête le moteur sous 0.5 s.

---

## 6. UI / UX

- Écrans essentiels : écran principal (état du volet), écran historique, écran réglages règles météo, écran notifications.
- Flux : connexion -> page d'accueil -> contrôle rapide -> paramètres -> logs.

---

## 7. Cas d'utilisation

- En tant qu'utilisateur, je veux que le volet se ferme automatiquement quand les conditions météorologiques ne sont pas favorables.
- En tant qu'utilisateur, je veux ouvrir manuellement le volet depuis l'app.

---

## 8. Tests & Critères d'acceptation

- Tests unitaires : firmware logique, backend endpoints.
- Tests d'intégration : envoi de télémétrie + réaction automatique.
- Tests d'acceptation utilisateur : scénarios (pluie, vent fort, obstruction) avec résultats attendus.

---

## 9. Remarques / Notes

