/**
 * Firebase Realtime Database initialization for Live Chat.
 * 
 * CARA SETUP (hanya sekali):
 * 1. Buka https://console.firebase.google.com/
 * 2. Buat project baru (atau pakai existing).
 * 3. Enable "Realtime Database" (Build > Realtime Database > Create Database).
 *    - Pilih location terdekat (misal asia-southeast1).
 *    - Start in test mode dulu (bisa diubah nanti lewat Rules).
 * 4. Project Settings (gear icon) > General > Your apps > Web (</>) > Register app.
 * 5. Copy config object, lalu isi di file .env (lihat .env.example).
 * 6. Pastikan databaseURL ada di config (biasanya otomatis: https://<project-id>-default-rtdb.firebaseio.com).
 *
 * Security (penting untuk production):
 *   - Buka Realtime Database > Rules.
 *   - Contoh rules sederhana (hanya izinkan chat):
 *     {
 *       "rules": {
 *         "chats": {
 *           "$roomId": {
 *             ".read": true,
 *             ".write": true,
 *             "messages": {
 *               ".indexOn": "ts"
 *             }
 *           }
 *         }
 *       }
 *     }
 */

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // WAJIB untuk Realtime DB
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Safe init: only initialize if we have the minimum required config for Realtime DB.
// This prevents fatal crash if Firebase values are placeholders or not yet filled.
const hasValidConfig = firebaseConfig.databaseURL && firebaseConfig.projectId;

let db: any = null;
if (hasValidConfig) {
  // Initialize hanya sekali (penting di Vite HMR)
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getDatabase(app);
} else {
  console.warn('[Firebase] Chat disabled: VITE_FIREBASE_* config incomplete (placeholders or missing). See firebase.ts for setup.');
}

export { db }

// Re-export helper yang sering dipakai di chat
export {
  ref,
  push,
  onValue,
  off,
  serverTimestamp,
  query,
  limitToLast,
  orderByChild,
} from 'firebase/database'

export type { DatabaseReference, DataSnapshot } from 'firebase/database'
