#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <NimBLEDevice.h>
#include <Preferences.h>

#define SERVO_PIN 13
Servo windowServo;
Preferences preferences;

// UUIDs BLE
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_CONFIG_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
String API_URL = "http://10.166.120.14 :3001/api/window/log";
String wifi_ssid = "";
String wifi_pass = "";
float latitude = 45.18;
float longitude = 5.72;
bool isOpen = false;

// Variables pour stocker la dernière météo (pour éviter de spammer l'API météo)
float lastTemp = 0.0;
int lastAQI = 0;
unsigned long lastWeatherCheck = 0;

// Variable globale pour éviter de spammer le servo s'il est déjà au bon angle
int currentAngle = -1;

void setWindow(int angle)
{
    // Sécurité : on borne entre 0 et 90
    if (angle < 0)
        angle = 0;
    if (angle > 90)
        angle = 90;

    if (currentAngle == angle)
        return; // On ne bouge pas si c'est déjà bon

    windowServo.write(angle);
    Serial.println(">>> MOTEUR : Angle " + String(angle) + "°");
    currentAngle = angle;

    // On met à jour isOpen pour l'info (si > 0 on considère que c'est ouvert)
    isOpen = (angle > 0);
}

// ... (Code BLE inchangé, je le condense pour la lisibilité)
class ConfigCallbacks : public BLECharacteristicCallbacks
{
    void onWrite(BLECharacteristic *pCharacteristic)
    {
        std::string value = pCharacteristic->getValue();
        if (value.length() > 0)
        {
            String data = String(value.c_str());
            int s1 = data.indexOf(';');
            int s2 = data.indexOf(';', s1 + 1);
            int s3 = data.indexOf(';', s2 + 1);
            if (s3 > 0)
            {
                wifi_ssid = data.substring(0, s1);
                wifi_pass = data.substring(s1 + 1, s2);
                latitude = data.substring(s2 + 1, s3).toFloat();
                longitude = data.substring(s3 + 1).toFloat();
                preferences.begin("config", false);
                preferences.putString("ssid", wifi_ssid);
                preferences.putString("pass", wifi_pass);
                preferences.putFloat("lat", latitude);
                preferences.putFloat("lon", longitude);
                preferences.end();
                ESP.restart();
            }
        }
    }
};

void checkSystem()
{
    if (WiFi.status() != WL_CONNECTED)
        return;

    // 1. Récupération Météo (Toutes les 60 secondes seulement pour pas saturer)
    if (millis() - lastWeatherCheck > 60000 || lastWeatherCheck == 0)
    {
        HTTPClient http;
        http.begin("https://api.open-meteo.com/v1/forecast?latitude=" + String(latitude) + "&longitude=" + String(longitude) + "&current=temperature_2m,european_aqi");
        int code = http.GET();
        if (code > 0)
        {
            String payload = http.getString();
            JsonDocument doc;
            deserializeJson(doc, payload);
            lastTemp = doc["current"]["temperature_2m"];
            lastAQI = doc["current"]["european_aqi"];
            if (doc["current"]["european_aqi"].isNull())
                lastAQI = 20;
        }
        http.end();
        lastWeatherCheck = millis();
    }

    // 2. Envoi Log au Serveur ET Lecture de l'Ordre
    HTTPClient httpLog;
    httpLog.begin(API_URL);
    httpLog.addHeader("Content-Type", "application/json");

    String jsonStr;
    JsonDocument logDoc;
    logDoc["temp"] = lastTemp;
    logDoc["aqi"] = lastAQI;
    logDoc["isOpen"] = isOpen;
    serializeJson(logDoc, jsonStr);

    int httpResponseCode = httpLog.POST(jsonStr);

    if (httpResponseCode > 0)
    {
        String response = httpLog.getString();
        JsonDocument resDoc;
        deserializeJson(resDoc, response);

        String command = resDoc["command"].as<String>();
        int targetAngle = resDoc["angle"];

        Serial.print("Ordre: " + command + " | Angle: " + String(targetAngle));

        if (command == "MANUAL")
        {
            Serial.println(" -> Application MANUELLE");
            setWindow(targetAngle);
        }
        else
        {
            Serial.println(" -> Mode AUTO");
            // En auto, on décide : soit 0 (fermé), soit 90 (ouvert en grand)
            // Tu pourrais aussi mettre 45 en auto si tu veux !
            if (lastTemp > 30.0 || lastAQI > 50)
                setWindow(0);
            else
                setWindow(90);
        }
    }
    httpLog.end();
}

void setup()
{
    Serial.begin(115200);
    windowServo.setPeriodHertz(50);
    windowServo.attach(SERVO_PIN, 500, 2400);

    preferences.begin("config", true);
    wifi_ssid = preferences.getString("ssid", "");
    wifi_pass = preferences.getString("pass", "");
    latitude = preferences.getFloat("lat", 45.18);
    longitude = preferences.getFloat("lon", 5.72);
    preferences.end();

    BLEDevice::init("ESP32_SmartWindow");
    BLEServer *pServer = BLEDevice::createServer();
    BLEService *pService = pServer->createService(SERVICE_UUID);
    BLECharacteristic *pChar = pService->createCharacteristic(CHAR_CONFIG_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE);
    pChar->setCallbacks(new ConfigCallbacks());
    pService->start();
    BLEDevice::getAdvertising()->addServiceUUID(SERVICE_UUID);
    BLEDevice::getAdvertising()->start();

    if (wifi_ssid != "")
        WiFi.begin(wifi_ssid.c_str(), wifi_pass.c_str());
}

void loop()
{
    // Vérification rapide (toutes les 2 secondes) pour être réactif aux boutons
    static unsigned long lastCheck = 0;
    if (millis() - lastCheck > 2000)
    {
        checkSystem();
        lastCheck = millis();
    }
    delay(100);
}
