/*
 * Smart Locker System — ESP32 Firmware
 * Hardware: ESP32 + 4x4 Keypad + 16x2 I2C LCD + LED on GPIO2
 */

#include <WiFi.h>
#include <FirebaseESP32.h>
#include <Keypad.h>
#include <LiquidCrystal_I2C.h>
#include <time.h>

// ── WiFi ──────────────────────────────────────────────────────
#define WIFI_SSID     "MVSR Solar"
#define WIFI_PASSWORD "MVSRBM70"

// ── Firebase ──────────────────────────────────────────────────
// STEP 1: Paste your Realtime Database URL here (from Firebase Console)
#define FIREBASE_HOST "smart-locker-system-5aa75-default-rtdb.firebaseio.com"
// STEP 2: Paste your Database Secret here
// Firebase Console → Project Settings → Service Accounts → Database secrets → Show
#define FIREBASE_AUTH "bxkYIh5q9IdvjiyiFSlvonaQtHbk70VVukc4rueA"

// ── GPIO ──────────────────────────────────────────────────────
#define LOCK_PIN  2   // LED long leg → GPIO2, short leg → GND (with 220Ω resistor)

// ── Keypad (4x4) ──────────────────────────────────────────────
const byte ROWS = 4, COLS = 4;
char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
byte rowPins[ROWS] = {13, 12, 14, 27};
byte colPins[COLS] = {26, 25, 33, 32};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// ── LCD (I2C 0x27, 16x2) ─────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ── Firebase objects ──────────────────────────────────────────
FirebaseData   fbData;
FirebaseAuth   fbAuth;
FirebaseConfig fbConfig;

// ── State machine ─────────────────────────────────────────────
enum State { WAIT_USERID, WAIT_PIN, WAIT_OTP, GRANTED, DENIED };
State currentState = WAIT_USERID;

String inputBuffer   = "";
String enteredUserId = "";
String enteredPin    = "";
String resolvedUid   = "";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

void lcdPrint(const char* line1, const char* line2 = "") {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(line1);
  lcd.setCursor(0, 1); lcd.print(line2);
}

void setLock(bool unlocked) {
  digitalWrite(LOCK_PIN, unlocked ? HIGH : LOW);
}

void logAccess(const String& userId, const String& userName, bool success, const String& reason) {
  FirebaseJson json;
  json.set("userId",        userId);
  json.set("userName",      userName);
  json.set("success",       success);
  json.set("action",        success ? "Locker Opened" : "Access Denied");
  json.set("method",        "UserID+PIN+OTP");
  json.set("reason",        reason);
  json.set("timestamp/.sv", "timestamp");
  Firebase.pushJSON(fbData, "/accessLogs", json);
}

void resetToStart() {
  enteredUserId = ""; enteredPin = ""; resolvedUid = "";
  inputBuffer   = "";
  setLock(false);
  lcdPrint("Locker Ready", "Enter User ID #");
  currentState = WAIT_USERID;
}

void grantAccess(const String& userName) {
  currentState = GRANTED;
  lcdPrint("Access Granted!", userName.c_str());
  setLock(true);                                                    // LED ON
  Firebase.setString(fbData, "/locker/status/state", "unlocked");
  logAccess(enteredUserId, userName, true, "PIN+OTP verified");
  delay(5000);                                                      // 5 sec open
  setLock(false);                                                   // LED OFF
  Firebase.setString(fbData, "/locker/status/state", "locked");
  lcdPrint("Locker Locked", "");
  delay(1000);
  resetToStart();
}

void denyAccess(const String& reason) {
  currentState = DENIED;
  lcdPrint("Denied!", reason.c_str());
  // Flash LED 3 times to show denial
  for (int i = 0; i < 3; i++) {
    digitalWrite(LOCK_PIN, HIGH); delay(150);
    digitalWrite(LOCK_PIN, LOW);  delay(150);
  }
  logAccess(enteredUserId.length() > 0 ? enteredUserId : "?", "Unknown", false, reason);
  delay(800);
  resetToStart();
}

// ─────────────────────────────────────────────────────────────
// FIREBASE CHECKS
// ─────────────────────────────────────────────────────────────

// Looks up /userIdMap/1234 → returns the Firebase UID
bool resolveUid(const String& numericId) {
  String path = "/userIdMap/" + numericId;
  if (Firebase.getString(fbData, path) && fbData.stringData().length() > 0) {
    resolvedUid = fbData.stringData();
    return true;
  }
  return false;
}

// Checks /users/{uid}/pin matches what user typed
bool verifyPin(const String& uid, const String& pin) {
  String path = "/users/" + uid + "/pin";
  if (Firebase.getString(fbData, path)) {
    return fbData.stringData() == pin;
  }
  return false;
}

// Checks /otps/{uid}/code, expiresAt, used
bool verifyOtp(const String& uid, const String& otp, String& outName) {
  String codePath   = "/otps/" + uid + "/code";
  String expiryPath = "/otps/" + uid + "/expiresAt";
  String usedPath   = "/otps/" + uid + "/used";
  String namePath   = "/users/" + uid + "/fullName";

  String storedOtp = "";
  long   expiresAt = 0;
  bool   used      = true;

  if (Firebase.getString(fbData, codePath))  storedOtp = fbData.stringData();
  if (Firebase.getInt(fbData,    expiryPath)) expiresAt = fbData.intData();
  if (Firebase.getBool(fbData,   usedPath))   used      = fbData.boolData();
  if (Firebase.getString(fbData, namePath))   outName   = fbData.stringData();

  Serial.println("OTP check: stored=" + storedOtp + " entered=" + otp + " used=" + used);

  if (used)                              { Serial.println("OTP already used"); return false; }
  if ((long)time(nullptr)*1000L > expiresAt) { Serial.println("OTP expired");      return false; }
  if (storedOtp != otp)                 { Serial.println("OTP mismatch");      return false; }

  Firebase.setBool(fbData, usedPath, true); // mark used
  return true;
}

// ─────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  // LED
  pinMode(LOCK_PIN, OUTPUT);
  digitalWrite(LOCK_PIN, LOW);

  // LCD
  lcd.init();
  lcd.backlight();
  lcdPrint("Smart Locker", "Booting...");

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lcdPrint("Connecting WiFi", "...");
  Serial.print("Connecting WiFi");
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500); Serial.print("."); tries++;
  }
  if (WiFi.status() != WL_CONNECTED) {
    lcdPrint("WiFi Failed!", "Check creds");
    Serial.println("\nWiFi FAILED");
    while (true) delay(1000);
  }
  Serial.println("\nWiFi OK: " + WiFi.localIP().toString());
  lcdPrint("WiFi OK!", WiFi.localIP().toString().c_str());
  delay(1200);

  // NTP time (needed for OTP expiry check) — IST = UTC+5:30
  configTime(19800, 0, "pool.ntp.org");
  lcdPrint("Syncing time...", "");
  delay(2000);
  struct tm ti;
  if (getLocalTime(&ti)) {
    Serial.println("Time synced OK");
  } else {
    Serial.println("Time sync failed — OTP expiry may not work");
  }

  // Firebase
  fbConfig.host = FIREBASE_HOST;
  fbConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);
  Serial.println("Firebase connected");

  // Mark locker as locked in DB
  Firebase.setString(fbData, "/locker/status/state", "locked");

  lcdPrint("System Ready!", "");
  delay(800);
  resetToStart();
}

// ─────────────────────────────────────────────────────────────
// MAIN LOOP
// ─────────────────────────────────────────────────────────────
void loop() {
  char key = keypad.getKey();
  if (!key) return;

  Serial.println("Key: " + String(key));

  // * = cancel and restart
  if (key == '*') {
    lcdPrint("Cancelled", "");
    delay(600);
    resetToStart();
    return;
  }

  switch (currentState) {

    // ── STEP 1: Type User ID then press # ──────────────────
    case WAIT_USERID:
      if (key >= '0' && key <= '9') {
        inputBuffer += key;
        String dots = "";
        for (unsigned int i = 0; i < inputBuffer.length(); i++) dots += "*";
        lcdPrint("User ID:", dots.c_str());
      }
      if (key == '#') {
        if (inputBuffer.length() < 4) {
          lcdPrint("Need 4+ digits", "Try again:");
          inputBuffer = ""; break;
        }
        enteredUserId = inputBuffer;
        inputBuffer   = "";
        lcdPrint("Checking...", enteredUserId.c_str());
        Serial.println("Looking up userId: " + enteredUserId);

        if (!resolveUid(enteredUserId)) {
          lcdPrint("Not Found!", "Try again:");
          Serial.println("User not found in /userIdMap/");
          delay(1500);
          enteredUserId = "";
          lcdPrint("Locker Ready", "Enter User ID #");
          currentState = WAIT_USERID;
        } else {
          Serial.println("Found UID: " + resolvedUid);
          lcdPrint("Found!", "Enter PIN + #");
          delay(700);
          currentState = WAIT_PIN;
        }
      }
      break;

    // ── STEP 2: Type PIN then press # ──────────────────────
    case WAIT_PIN:
      if (key >= '0' && key <= '9') {
        inputBuffer += key;
        String dots = "";
        for (unsigned int i = 0; i < inputBuffer.length(); i++) dots += "*";
        lcdPrint("PIN:", dots.c_str());
      }
      if (key == '#') {
        if (inputBuffer.length() < 4) {
          lcdPrint("4+ digits!", "Try again:");
          inputBuffer = ""; break;
        }
        enteredPin  = inputBuffer;
        inputBuffer = "";
        lcdPrint("Checking PIN...", "");
        Serial.println("Verifying PIN: " + enteredPin);

        if (!verifyPin(resolvedUid, enteredPin)) {
          Serial.println("PIN wrong");
          denyAccess("Wrong PIN");
        } else {
          Serial.println("PIN correct");
          lcdPrint("PIN OK!", "Enter OTP + #");
          delay(700);
          currentState = WAIT_OTP;
        }
      }
      break;

    // ── STEP 3: Type OTP (from web app) then press # ───────
    case WAIT_OTP:
      if (key >= '0' && key <= '9') {
        inputBuffer += key;
        String dots = "";
        for (unsigned int i = 0; i < inputBuffer.length(); i++) dots += "*";
        lcdPrint("OTP:", dots.c_str());
      }
      // Auto-submit when 4 digits entered OR user presses #
      if (inputBuffer.length() == 4 || key == '#') {
        if (inputBuffer.length() < 4) {
          lcdPrint("Need 4 digits", "Try again:");
          inputBuffer = ""; break;
        }
        String enteredOtp = inputBuffer;
        inputBuffer       = "";
        lcdPrint("Checking OTP...", "");
        Serial.println("Verifying OTP: " + enteredOtp);

        String userName = "";
        if (!verifyOtp(resolvedUid, enteredOtp, userName)) {
          Serial.println("OTP failed");
          denyAccess("OTP Invalid");
        } else {
          Serial.println("OTP correct! Granting access to: " + userName);
          grantAccess(userName.length() > 0 ? userName : "User");
        }
      }
      break;

    default: break;
  }
}
