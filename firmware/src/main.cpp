#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// --- 1. TES IDENTIFIANTS WIFI (À REMPLIR) ---
const char* SSID = "tpiot";
const char* PASSWORD = "tpiot697";

// --- 2. TA POSITION (Pour la météo) ---
float lat = 45.18; // Latitude (ex: Grenoble)
float lon = 5.72;  // Longitude

// --- 3. REGLAGES SERVO & SEUILS ---
#define SERVO_PIN 13       // Pin où est branché le fil orange/jaune du servo
Servo myservo;

// Change ces valeurs pour forcer le test !
// Si il fait 20°C chez toi, mets 15.0 pour tester la fermeture.
const float SEUIL_TEMP = 30.0; 
const int SEUIL_POLLUTION = 50; 

void setup() {
  Serial.begin(115200);
  
  // Attachement du servo
  // (Min 500us, Max 2400us sont des valeurs standards pour ESP32)
  myservo.setPeriodHertz(50); 
  myservo.attach(SERVO_PIN, 500, 2400);
  
  Serial.println("\n--- DÉBUT DU TEST ESP32 ---");
  
  // Connexion WiFi
  WiFi.begin(SSID, PASSWORD);
  Serial.print("Connexion au WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connecté !");
  Serial.print("Adresse IP : ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Construction de l'URL API
    String url = "https://api.open-meteo.com/v1/forecast?latitude=" + String(lat) + 
                 "&longitude=" + String(lon) + 
                 "&current=temperature_2m,european_aqi";

    Serial.println("\n🔍 Appel API Météo...");
    http.begin(url);
    int httpCode = http.GET();

    if (httpCode > 0) {
      String payload = http.getString();
      
      // Parsing du JSON
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (!error) {
        float temp = doc["current"]["temperature_2m"];
        int aqi = doc["current"]["european_aqi"];
        
        // Si l'AQI est null (pas de capteur dans la zone), on met 0 par sécurité
        if (doc["current"]["european_aqi"].isNull()) aqi = 0;

        Serial.println("-----------------------------");
        Serial.print("🌡️ Température actuelle : "); Serial.print(temp); Serial.println(" °C");
        Serial.print("🏭 Pollution (AQI)     : "); Serial.println(aqi);
        Serial.println("-----------------------------");

        // Logique de contrôle
        if (temp > SEUIL_TEMP || aqi > SEUIL_POLLUTION) {
          Serial.println("⚠️ Conditions MAUVAISES -> FERMETURE du volet (0°)");
          myservo.write(0); 
        } else {
          Serial.println("☀️ Conditions BONNES    -> OUVERTURE du volet (90°)");
          myservo.write(90);
        }
      } else {
        Serial.print("❌ Erreur de lecture JSON : ");
        Serial.println(error.c_str());
      }
    } else {
      Serial.print("❌ Erreur HTTP : ");
      Serial.println(httpCode);
    }
    http.end();
  } else {
    Serial.println("❌ WiFi perdu !");
  }

  // Attendre 10 secondes avant la prochaine vérif
  Serial.println("Attente 10s...");
  delay(10000);
}