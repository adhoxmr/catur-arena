# Setup Firebase Realtime Database untuk Fitur Live Chat

**Mau cepat?** Baca dulu **[FIREBASE_CHEATSHEET.md](FIREBASE_CHEATSHEET.md)** (1 halaman).

Fitur **Live Chat** di Catur Arena sekarang menggunakan **Firebase Realtime Database**.  
Chat berjalan **real-time** di sisi klien (React/Vite) tanpa perlu coding server untuk pesan chat.

Chat muncul di bawah papan catur menggunakan sistem **Tabs**:
- **Langkah** - Riwayat langkah + bidak tertangkap
- **Chat Live** - Pesan real-time

Tag otomatis:
- **[PEMAIN]** (hijau) - Jika wallet address kamu sama dengan salah satu pemain yang bertaruh (white/black).
- **[PENONTON]** (abu-abu) - Penonton biasa / guest.

---

## 1. Buat Project Firebase (Gratis)

1. Buka https://console.firebase.google.com/
2. Klik **Add project** (atau pakai project yang sudah ada).
3. Beri nama project (contoh: catur-arena-chat).
4. Matikan Google Analytics kalau tidak perlu - Continue.
5. Tunggu project selesai dibuat - Continue.

---

## 2. Aktifkan Realtime Database

1. Di sidebar kiri, pilih **Build** > **Realtime Database**.
2. Klik tombol **Create Database**.
3. Pilih lokasi database (pilih yang terdekat, misalnya asia-southeast1 atau us-central1).
4. Pilih **Start in test mode** (kita akan ganti Rules nanti).
5. Klik **Enable**.

Sekarang database sudah aktif.

---

## 3. Ambil Firebase Web Config

1. Di pojok kiri atas, klik **Project settings** (ikon roda gigi).
2. Scroll ke bawah ke bagian **Your apps**.
3. Klik icon **Web** (</>).
4. Beri nama app (contoh: Catur Arena Client) - Register app.
5. Firebase akan menampilkan config seperti ini:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "catur-arena-chat.firebaseapp.com",
  databaseURL: "https://catur-arena-chat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catur-arena-chat",
  storageBucket: "catur-arena-chat.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

**Catat / copy semua nilai ini.**

---

## 4. Masukkan Config ke Environment Client

Buka file:

catur-arena/client/.env.local

Tambahkan / ganti bagian Firebase di bawah (sudah ada template):

```env
# ============================================
# FIREBASE REALTIME DATABASE (Live Chat)
# ============================================
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=catur-arena-chat.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://catur-arena-chat-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=catur-arena-chat
VITE_FIREBASE_STORAGE_BUCKET=catur-arena-chat.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

**PENTING:**
- VITE_FIREBASE_DATABASE_URL adalah yang paling sering salah. Pastikan pakai URL lengkap dari Firebase (bukan hanya project ID).
- Simpan file.
- **Restart** dev server client setelah mengubah .env.

---

## 5. Atur Security Rules (WAJIB untuk Production)

Secara default "test mode" membolehkan siapa saja baca/tulis.  
Untuk game ini kita pakai rules sederhana tapi lebih aman.

1. Di Firebase Console - Realtime Database - tab **Rules**.
2. Ganti isinya dengan ini:

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

3. Klik **Publish**.

**Penjelasan singkat:**
- Siapa saja bisa baca & tulis chat di room manapun (cukup untuk game publik).
- Setiap pesan wajib punya text, name, ts.
- Maksimal 280 karakter per pesan.
- .indexOn "ts" biar query cepat.

Nanti kalau mau lebih ketat (hanya user login, rate limit, dll) bisa ditambah.

---

## 6. Jalankan & Test

### Local Test

1. Pastikan kedua server jalan:

   # Terminal 1 - Client
   cd catur-arena/client
   npm run dev:host

   # Terminal 2 - Server
   cd catur-arena/server
   npm run dev

2. Buka dua tab browser (atau dua HP):
   - Tab 1: Buka http://IP-LAPTOP:5173/spingu - connect wallet - buat game (real bet AI atau multiplayer).
   - Tab 2: Buka URL game yang sama (atau buat game baru dengan room yang sama) - jangan connect wallet (atau pakai wallet lain).

3. Di bawah papan catur, klik tab **Chat Live**.
4. Ketik pesan di kedua tab.
   - Yang pakai wallet yang bermain - muncul tag [PEMAIN]
   - Yang tidak - [PENONTON]

5. Pesan harus muncul secara real-time di kedua sisi.

### Test di Bitget Wallet Android

- Jalankan "npm run dev:host" di client.
- Di Bitget dApp browser buka http://IP:5173/spingu
- Buat game - masuk ke game - coba chat dari HP dan dari laptop.

---

## 7. Untuk VPS / Production

Saat deploy pakai vps-setup.sh atau manual:

1. Di server VPS, edit file environment client sebelum build:

   nano /home/catur/catur-arena/client/.env.local

   (atau buat file .env dan pastikan Vite membacanya saat build)

2. Isi 7 baris VITE_FIREBASE_* sama seperti di lokal.

3. Rebuild frontend:

   cd /home/catur/catur-arena/client
   npm run build

4. Restart PM2 / Nginx kalau perlu.

5. Pastikan Firebase Rules sudah di-publish (bukan test mode lagi kalau mau lebih aman).

---

## 8. Troubleshooting

| Masalah                              | Solusi |
|--------------------------------------|--------|
| Tidak ada pesan muncul sama sekali   | Cek VITE_FIREBASE_DATABASE_URL - ini yang paling sering salah. Pastikan pakai URL lengkap. |
| Chat muncul di satu sisi saja        | Cek Firebase Rules (harus .read: true dan .write: true). |
| Error "permission_denied"            | Rules masih ketat atau belum dipublish. |
| Tag selalu [PENONTON] meski pakai wallet | Di real-bet, pastikan server sudah di-restart (kita tambah playerAddresses di socket). |
| Chat tidak muncul di game AI         | Untuk spingu-ai, pastikan URL mengandung ?room=SPG-XXXXXX&real=1. |
| Masih pakai data lama                | Coba hapus node "chats/{roomId}" di Firebase Console (Realtime Database - Data). |

---

## 9. Struktur Data di Firebase (Opsional)

Chat disimpan seperti ini:

chats/
  SPG-123456/
    messages/
      -Oabc123def/
        text: "Halo bro!"
        name: "0xAbC...dEf4"
        address: "0xAbCdEf..."
        ts: 1730000000000

Room ID game = key chat (sangat mudah).

---

## Selesai!

Setelah langkah di atas, fitur Live Chat sudah hidup di:
- /game/online?...
- /game/spingu-ai?...
- /vs-ai (terutama kalau pakai wallet / real bet)

Kalau ada pertanyaan atau ingin tambahan fitur (misalnya emoji picker, block user, atau hapus chat setelah game selesai), bilang saja!

Selamat bermain catur + ngobrol bareng penonton! 
