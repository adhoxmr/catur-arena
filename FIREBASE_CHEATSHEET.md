# 🔥 Firebase Live Chat - Cheatsheet (1 Halaman)

## 1. Buat Project Firebase
1. https://console.firebase.google.com → Add project
2. Nama: `catur-arena-chat` → Continue (matikan Analytics)
3. Build → Realtime Database → Create Database
   - Pilih region Asia → Start in test mode → Enable

## 2. Ambil Config (Web App)
Project Settings (⚙️) → Your apps → Web (</>) → Register app

Copy 7 nilai ini:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://xxx-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123...
VITE_FIREBASE_APP_ID=1:123...:web:abc...
```

## 3. Isi .env.local (Client)
Buka `catur-arena/client/.env.local`

Paste 7 baris di atas (ganti semua nilai).

**Restart client:**
```bash
cd client
npm run dev:host
```

## 4. Publish Security Rules (Paling Penting!)
Realtime Database → Rules tab → Ganti semua dengan ini:

```json
{
  "rules": {
    "chats": {
      "$roomId": {
        ".read": true,
        ".write": true,
        ".indexOn": "ts",
        "messages": {
          "$messageId": {
            ".validate": "newData.hasChildren(['text', 'name', 'ts']) && newData.child('text').isString() && newData.child('text').val().length > 0 && newData.child('text').val().length <= 280"
          }
        }
      }
    }
  }
}
```

Klik **Publish**.

## 5. Test Cepat
- Buka 2 tab:
  - Tab 1: `http://IP:5173/spingu` → Connect wallet → Buat game real bet
  - Tab 2: Buka link game yang sama → Jangan connect wallet
- Di game → klik tab **Chat Live**
- Kirim pesan → Harus muncul real-time
- Pemain pakai wallet = tag **[PEMAIN]**

## Untuk VPS / Deploy
Sebelum `npm run build` di client:
```bash
nano client/.env.local   # isi 7 VITE_FIREBASE_*
npm run build
```

Lalu restart PM2.

## Troubleshooting Cepat
- Tidak ada chat sama sekali? → Cek `DATABASE_URL` (harus full URL)
- Permission denied? → Rules belum di-Publish
- Tag selalu PENONTON? → Restart server (backend) setelah update code
- Ingin reset chat? → Firebase Console → Data → hapus node `chats/ROOM-ID`

---

**Butuh penjelasan lengkap?** Baca `FIREBASE_LIVE_CHAT_SETUP.md`

**Chat sekarang aktif di semua halaman game (VsAI + Multiplayer) dengan Tabs di bawah papan.** 

Siap pakai! ♟️💬
