# 🔥 Firebase Setup & Deployment Guide: Peace Day Gaming Arena

This document provides complete instructions for configuring and connecting Firebase (Firestore & Authentication) to the **Peace Day Gaming Arena** application, or deploying it to cloud hosting.

---

## 1. Creating Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it (e.g. `peaceday-gaming-arena`).
3. (Optional) Disable Google Analytics for faster setup, then click **Create Project**.

---

## 2. Enabling Authentication
1. In the Firebase console left menu, go to **Build** → **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - Enable **Anonymous** (allows audience phones to have persistent session IDs without requiring personal emails).
   - Enable **Email/Password** (for event organizers & management login).
4. In the **Users** tab, add an organizer account (e.g. `admin@college.edu` with your secure event password).

---

## 3. Creating Cloud Firestore Database
1. In the Firebase console left menu, go to **Build** → **Firestore Database**.
2. Click **Create Database**.
3. Select your preferred Cloud Region (e.g. `asia-south1` for Mumbai/Hyderabad lowest latency).
4. Start in **Production Mode**.

---

## 4. Deploying Security Rules
Copy the rules from `firestore.rules` into your Firebase Console under **Firestore Database** → **Rules** tab, then click **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && (request.auth.token.admin == true || request.auth.token.role == 'organizer');
    }

    match /eventSettings/{settingId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /participants/{participantId} {
      allow create: if request.resource.data.name is string 
                    && request.resource.data.rollNumber is string;
      allow read: if true;
      allow update, delete: if isAdmin();
    }

    match /rounds/{roundId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /buzzes/{buzzId} {
      allow read: if true;
      allow create: if request.resource.data.participantId is string
                    && request.resource.data.rollNumber is string;
      allow update, delete: if isAdmin();
    }

    match /riddles/{riddleId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 5. Adding Firebase Config to the App
1. In Firebase Console, go to **Project Settings** (gear icon) → **General**.
2. Under **Your apps**, click the **Web icon (`</>`)** to register a web app.
3. Name it `peaceday-web`.
4. Copy the `firebaseConfig` object and place your credentials into `.env`:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="peaceday-gaming.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="peaceday-gaming"
   VITE_FIREBASE_STORAGE_BUCKET="peaceday-gaming.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   ```

---

## 6. How the Built-in Server Works (Zero-Config Default)
The application currently includes an **authoritative Express + Server-Sent Events (SSE) server (`server.ts`)** that runs immediately out of the box:
- All 50+ students on campus connect to the live event server.
- The server records **millisecond timestamps** to prevent client clock manipulation.
- Broadcasts new buzzes, rounds, and participant counts instantly.
- Works offline on a local college Wi-Fi network without requiring cloud credit or billing!
