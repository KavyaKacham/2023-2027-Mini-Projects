# 2023-2027-Mini-Projects
B.E CSE (IOT &amp; CYBER SECURITY INCLUDING BLOCK CHAIN TECHNOLOGY) 2023-2027-Mini Projects
# Smart Secure Locker System with Multi-Factor Authentication

## Team Members

* **Singireddy Snehitha** – 2451-23-749-006
* **Kacham Kavya** – 2451-23-749-013
* **Avula Satwika** – 2451-23-749-032

---

# Smart Secure Locker System

A secure IoT-enabled locker management system built using **ESP32**, **Firebase**, and **React.js** that enables multiple users to securely share a single locker through **time-based booking sessions** and **Multi-Factor Authentication (MFA)**.

The system combines **PIN-based authentication**, **OTP verification**, **real-time cloud synchronization**, and a modern web dashboard to provide secure and intelligent locker access management.

## Live Demo

https://smart-locker-system-351q.vercel.app/

---

## Features

### Multi-Factor Authentication (MFA)

* Session PIN verification through keypad
* OTP generation and verification
* Secure two-step authentication process

### Smart Locker Booking

* Time-based slot booking system
* Multiple users can share a single locker
* Unique locker session allocation
* Booking extension support

### Cloud Integration

* Firebase Realtime Database synchronization
* Cloud Firestore storage
* Real-time locker status monitoring

### Web Dashboard

* User registration and login
* Slot booking management
* OTP generation interface
* Access log monitoring
* User profile management

### Security Features

* OTP expiry mechanism
* Failed-attempt lockout protection
* Access logging and audit trail
* Session validation
* Real-time event monitoring

### Hardware Integration

* ESP32 Microcontroller
* 4×4 Matrix Keypad
* 16×2 LCD Display
* Relay Module
* Solenoid Lock
* Active Buzzer

---

## Hardware Requirements

* ESP32 Development Board
* 4×4 Matrix Keypad
* 16×2 LCD Display (I2C)
* Relay Module
* Solenoid Lock
* Active Buzzer
* Breadboard & Jumper Wires
* Power Supply

---

## Software Requirements

### Frontend

* React.js
* Vite
* React Router DOM

### Backend & Cloud

* Firebase Authentication
* Firebase Realtime Database
* Cloud Firestore

### Development Tools

* Arduino IDE
* Visual Studio Code
* Git & GitHub
* Vercel

---

## Project Architecture

User → Web Dashboard (React) → Firebase → ESP32 → Locker Hardware

Hardware Components:

* Keypad for PIN and OTP entry
* LCD for status display
* Relay-controlled solenoid lock
* Buzzer for alerts and notifications

---

## Installation & Setup

### Clone Repository

```bash
git clone https://github.com/KavyaKacham/smart-locker-system.git
cd smart-locker-system
```

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Configure Firebase

Create a Firebase project and enable:

* Firebase Authentication
* Cloud Firestore
* Firebase Realtime Database

Update Firebase configuration inside the project before running.

### Configure ESP32

Update Wi-Fi credentials:

```cpp
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
```

Upload the firmware using Arduino IDE.

---

## Working Flow

1. User registers through the dashboard.
2. User books an available locker slot.
3. User enters User ID and PIN on the keypad.
4. ESP32 verifies the PIN.
5. OTP is generated and stored in Firebase.
6. User retrieves OTP from the dashboard.
7. User enters OTP through keypad.
8. ESP32 validates OTP.
9. Locker unlocks upon successful verification.
10. Access event is recorded in Firebase.
11. Locker automatically locks after use.

---

## Project Structure

```text
smart-locker-system/
├── public/
├── server/
├── src/
│   ├── assets/
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   └── utils/
├── README.md
├── package.json
└── vite.config.js
```

---

## Key Modules

### Authentication Module

* Login
* Registration
* PIN Management
* OTP Verification

### Slot Booking Module

* Time-based reservation
* Slot extension
* Booking cancellation

### Access Log Module

* Successful access records
* Failed attempts
* Security audit trail

### Profile Management

* User information
* Password updates
* Booking history

---

## Security Features

* Multi-Factor Authentication
* OTP Expiry Enforcement
* Brute Force Protection
* Session-Based Access Control
* Real-Time Event Logging
* Cloud Synchronization
* Time-Limited Access Sessions

---

## Future Enhancements

* Mobile Application
* Fingerprint Authentication
* Face Recognition
* SMS/Email OTP Delivery
* Push Notifications
* Multi-Locker Management
* AI-Based Intrusion Detection
* Advanced Security Analytics

---

## Technologies Used

* ESP32
* React.js
* Firebase Authentication
* Firebase Realtime Database
* Cloud Firestore
* Vite
* Arduino IDE
* JavaScript
* HTML
* CSS
* GitHub
* Vercel

---

## Academic Information

Department of Computer Science & Engineering (Allied)

MVSR Engineering College

Academic Year: 2025–2026

Mini Project

Guide: **M. Anupama (Associate Professor)**

---

## License

This project was developed for academic and educational purposes as part of the Bachelor of Engineering curriculum.
