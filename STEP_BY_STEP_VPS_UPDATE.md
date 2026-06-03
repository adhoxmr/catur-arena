# PANDUAN LENGKAP STEP BY STEP UPDATE GAME KE VPS

**Ini panduan super detail untuk kamu yang mungkin baru pertama kali pakai VPS.**

Semua perintah ditulis jelas, termasuk **cara masuk ke folder mana** setiap saat.

---

## SITUASI KAMU SAAT INI (Dari Output yang Kamu Kirim)

Kamu sudah login sebagai `catur@ubuntu`

Kamu sudah di folder yang benar:

`/home/catur/catur-arena/`

Tapi dari `ls` yang kamu tunjukkan, file-file baru seperti `rebuild-prod.sh` dan `catur-build.env.example` **belum ada**.

Artinya: Kamu **belum pull** perubahan terbaru dari GitHub.

**Jadi langkah pertama yang harus kamu lakukan sekarang (di terminal VPS yang kamu buka ini):**

Lanjut ke bagian di bawah "LANGKAH CEPAT JIKA KAMU SUDAH DI VPS DAN DI FOLDER INI"

---

## LANGKAH CEPAT JIKA KAMU SUDAH DI VPS DAN DI FOLDER INI (Dari ls yang kamu kirim)

Kamu sedang di prompt:

catur@ubuntu:~/catur-arena$

### A. Pastikan kode terbaru dari lokal sudah di-push dulu (lakukan di laptop)

Buka PowerShell baru di laptop kamu, lalu ketik satu per satu:

```powershell
cd C:\Users\bgxhg\catur-arena
```

Cek perubahan:

```powershell
git status
```

Tambah semua:

```powershell
git add .
```

Commit:

```powershell
git commit -m "add rebuild script with auto backup + detailed guide"
```

Push:

```powershell
git push
```

Tunggu sampai selesai (lihat "Everything up-to-date" atau sukses).

### B. Kembali ke terminal VPS kamu (yang sekarang)

Kamu baru saja coba `git pull` dan dapat error seperti ini:

```
error: Your local changes to the following files would be overwritten by merge:
        client/package-lock.json
        client/src/pages/SpinguArenaPage.tsx
        server/src/index.ts
Please commit your changes or stash them before you merge.
Aborting
```

Ini normal. VPS punya perubahan lokal dari sebelumnya (dari npm install atau edit lama).

**Perintah yang harus kamu ketik SEKARANG (copy paste satu per satu):**

```bash
git stash
```

Lalu:

```bash
git pull
```

Sekarang pull harus sukses.

Cek file baru:

```bash
ls
```

Harus muncul sekarang:
- `rebuild-prod.sh`
- `catur-build.env.example`
- `STEP_BY_STEP_VPS_UPDATE.md`
- `CARA_UPDATE_VPS.md`
- dll.

Jika `ls` masih belum kelihatan file baru, coba lagi:

```bash
git pull
ls | grep -E 'rebuild|catur-build|STEP'
```

Sekarang lanjut ke bagian **C. Setup Environment File** di bawah.

---

## LANGKAH SELANJUTNYA SETELAH GIT PULL BERHASIL (Dari ls yang baru kamu kirim)

Kamu sudah punya `rebuild-prod.sh` dan panduan di VPS.

Sekarang buat file environment.

Karena `catur-build.env.example` mungkin belum kelihatan di ls kamu, kita buat file env langsung di home.

Ketik ini (masih di ~/catur-arena ):

```bash
cat > ~/catur-build.env << 'EOF'
export VITE_SERVER_URL=https://spingu.smkn1pulaurakyat.sch.id

# SatuChain
export VITE_SATUCHAIN_RPC_URL=https://rpc-mainnet.satuchain.com

# Smart Contract
export VITE_SPINGU_CHESS_ESCROW=0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43
export VITE_SPINGU_TREASURY=0x600cFd2aCfD798B7f7bC5Fbbcc5FCe4a2A579684

# =====================================================
# FIREBASE REALTIME DATABASE (WAJIB untuk Live Chat)
# =====================================================
# GANTI SEMUA BARIS DI BAWAH INI DENGAN NILAI ASLI DARI FIREBASE CONSOLE KAMU

export VITE_FIREBASE_API_KEY=AIzaSy...GANTI_DENGAN_ASLI_KAMU...
export VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
export VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app
export VITE_FIREBASE_PROJECT_ID=your-project-id
export VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
export VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
export VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnopqrstuvwxyz123456
EOF
```

Kemudian edit untuk ganti nilai Firebase:

```bash
nano ~/catur-build.env
```

**Jawaban untuk pertanyaanmu:**
**Ya, nilai Firebase yang asli BISA menyusul nanti setelah update.**

Kamu boleh:
- Untuk sementara isi dengan placeholder (seperti sekarang) atau bahkan biarkan baris Firebase-nya kosong/dummy.
- Jalankan rebuild sekarang untuk update UI + kode terbaru.
- Nanti, kapan saja setelah kamu punya nilai Firebase asli dari console:
  1. Edit lagi file `~/catur-build.env`
  2. Isi 7 baris Firebase dengan nilai yang benar.
  3. Jalankan ulang `./rebuild-prod.sh`

Script akan otomatis backup lagi, rebuild client dengan env yang benar, dan restart. Chat Live akan langsung aktif setelah itu.

Jadi tidak perlu menunggu Firebase dulu untuk update yang lain.

Simpan (Ctrl+O Enter, Ctrl+X).

Lalu buat script executable dan jalankan:

```bash
chmod +x rebuild-prod.sh
./rebuild-prod.sh
```

Script akan otomatis backup dulu, lalu build ulang client dan server, restart PM2.

Tunggu sampai selesai, lalu test di https://spingu.smkn1pulaurakyat.sch.id

Jika script bilang env tidak ditemukan, pastikan file ~/catur-build.env ada (cat ~/catur-build.env untuk cek).

**Mengapa belum ada perubahan (dari output kamu tadi):**

Dari yang kamu kirim:

- index.html tanggal Jun 2 17:55 (masih lama)
- grep cuma nemu "Catur Arena" (dari title lama)
- Tanggal VPS sekarang Jun 3

Artinya: kamu belum menjalankan `./rebuild-prod.sh` (atau script belum selesai update dist).

Dist masih pakai build dari sebelum pull/redesign.

**Langsung jalankan sekarang:**

```bash
cd ~/catur-arena
./rebuild-prod.sh
```

Setelah selesai (tunggu pesan "✅ Rebuild + Backup selesai!"), cek ulang dist:

```bash
cd ~/catur-arena/client/dist
ls -l index.html
echo "=== Cek string baru dari redesign ==="
grep -o 'Main catur lawan AI, lawan pemain online, atau bertaruh Spingu Token' assets/*.js | head -1 || echo "Belum ketemu (mungkin di chunk lain)"
```

Kalau ketemu string panjang itu, berarti redesign sudah ter-build.

Lalu di browser **hard refresh Ctrl+Shift+R**.

Kalau masih tidak kelihatan di live site, kemungkinan besar browser cache (terutama di Bitget dApp). Coba:

- Tab Incognito
- Atau tambah `?v=4` di URL: https://spingu.smkn1pulaurakyat.sch.id/?v=4

Kirim output `ls -l index.html` setelah script jalan.

### C. Setup Environment File (sekali saja)

```bash
cp catur-build.env.example ~/catur-build.env
```

Edit:

```bash
nano ~/catur-build.env
```

- Isi semua VITE_ termasuk 7 baris Firebase kamu yang asli.
- Simpan: Ctrl + O lalu Enter, lalu Ctrl + X

### D. Buat script executable dan jalankan (ini yang otomatis backup + rebuild)

```bash
chmod +x rebuild-prod.sh
```

Jalankan:

```bash
./rebuild-prod.sh
```

Script akan otomatis:
- Backup dulu project kamu
- git pull (lagi)
- Build server
- Build client (pakai env yang kamu isi)
- Restart backend

Tunggu sampai selesai. Di akhir akan kasih tau lokasi backup.

**PENTING: Karena kamu bilang alamat di VPS adalah https://spingu.smkn1pulaurakyat.sch.id/catur , kita harus set base path /catur/ agar assets dan routing benar.**

Jika kamu sudah jalankan script sebelumnya, dist mungkin salah path.

Lakukan ini untuk fix subpath /catur :

1. Update vite.config.ts di VPS:

```bash
cat > ~/catur-arena/client/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
})
EOF
```

2. Update main.tsx untuk basename:

```bash
cat > ~/catur-arena/client/src/main.tsx << 'EOF'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || '/'}>
      <App />
      <Toaster position="top-center" richColors closeButton />
    </BrowserRouter>
  </StrictMode>,
)
EOF
```

3. Update env dengan base:

```bash
cat > ~/catur-build.env << 'EOF'
export VITE_SERVER_URL=https://spingu.smkn1pulaurakyat.sch.id

# Base path untuk subdir /catur
export VITE_BASE_PATH=/catur/

# SatuChain
export VITE_SATUCHAIN_RPC_URL=https://rpc-mainnet.satuchain.com

# Smart Contract
export VITE_SPINGU_CHESS_ESCROW=0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43
export VITE_SPINGU_TREASURY=0x600cFd2aCfD798B7f7bC5Fbbcc5FCe4a2A579684

# FIREBASE (placeholder dulu, isi nanti)
export VITE_FIREBASE_API_KEY=placeholder-isi-nanti
export VITE_FIREBASE_AUTH_DOMAIN=placeholder-isi-nanti
export VITE_FIREBASE_DATABASE_URL=placeholder-isi-nanti
export VITE_FIREBASE_PROJECT_ID=placeholder-isi-nanti
export VITE_FIREBASE_STORAGE_BUCKET=placeholder-isi-nanti
export VITE_FIREBASE_MESSAGING_SENDER_ID=placeholder-isi-nanti
export VITE_FIREBASE_APP_ID=placeholder-isi-nanti
EOF
```

4. Update nginx untuk /catur :

```bash
cat > ~/catur-arena/nginx-catur.conf << 'EOF'
server {
    listen 80;
    server_name spingu.smkn1pulaurakyat.sch.id;

    location /catur/ {
        alias /home/catur/catur-arena/client/dist/;
        try_files $uri $uri/ /catur/index.html;
    }

    location = /catur {
        return 301 /catur/;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF
sudo cp ~/catur-arena/nginx-catur.conf /etc/nginx/sites-available/catur
sudo nginx -t && sudo systemctl reload nginx
```

5. Rebuild:

```bash
cd ~/catur-arena
chmod +x rebuild-prod.sh
./rebuild-prod.sh
```

Setelah selesai, hard refresh di https://spingu.smkn1pulaurakyat.sch.id/catur dengan Ctrl+Shift+R .

Ini akan bikin assets load dari /catur/assets/ dan routing benar.

Kirim output dari script jika ada masalah.

**Jika setelah script selesai kamu buka website tapi "tidak ada perubahan" (masih tampilan lama):**

Ini sangat umum karena browser cache.

Lakukan ini:

1. Buka website di **browser biasa** dulu (bukan Bitget dulu).
2. Tekan **Ctrl + Shift + R** (Windows) atau **Cmd + Shift + R** (Mac) untuk hard refresh.
3. Atau buka di tab **Incognito / Private** mode.

Cek perubahan yang seharusnya terlihat:
- Judul homepage sekarang "Catur Arena" (bukan "Main Catur. Seperti Juara Dunia.")
- Navigasi lebih sederhana (bukan banyak warna emerald).
- Tombol lebih flat, tidak terlalu rounded.
- Papan catur pakai warna wood klasik (#f0d9b5 dan #b58863).
- Chat lebih simpel.

Kalau masih sama setelah hard refresh:

**Cek di VPS apakah build benar-benar terbaru:**

Jalankan perintah ini di VPS:

```bash
cd ~/catur-arena/client/dist
ls -l index.html
echo "=== Cek headline baru di built file ==="
grep -o 'Catur Arena\|Main catur lawan AI' index.html | head -3
echo "=== Timestamp file ==="
date
```

Kalau di output muncul "Catur Arena" dan "Main catur lawan AI", berarti build sudah pakai kode baru.

Kalau masih muncul teks lama, berarti rebuild gagal atau belum jalan dengan benar.

Coba jalankan ulang:

```bash
cd ~/catur-arena
./rebuild-prod.sh
```

Lihat output-nya, pastikan ada bagian "Building Frontend..." tanpa error merah.

Setelah itu, di browser **hard refresh** lagi.

Untuk Bitget di HP: 
- Coba buka link di browser biasa dalam wallet dulu.
- Atau force close aplikasi Bitget, buka lagi, dan coba link.
- Atau tambahkan `?v=2` di akhir URL untuk bypass cache (https://spingu.../spingu?v=2)

Beritahu saya output dari perintah `grep` di atas di VPS, biar saya bisa kasih arahan lebih tepat.

Untuk Bitget Wallet di HP: biasanya cache lebih bandel. Coba tutup aplikasi Bitget total, buka lagi, atau pakai mode desktop di browser dalam wallet.

---

## Panduan Lengkap dari Awal (Kalau Mau Ikuti dari Laptop)

( the original detailed steps continue below )

## Persiapan Awal (Hanya Sekali)

Pastikan kamu sudah punya:
- Akses SSH ke VPS: `root@208.76.40.208`
- GitHub repo kamu sudah terhubung di lokal (adhoxmr)
- File `rebuild-prod.sh` dan `catur-build.env.example` sudah ada di folder lokal kamu

---

## LANGKAH 1: Dari Laptop (Lokal) - Push Perubahan Terbaru

Kamu sedang di Windows, pakai PowerShell.

### 1.1 Masuk ke folder proyek di laptop

Buka PowerShell, lalu ketik perintah ini persis:

```powershell
cd C:\Users\bgxhg\catur-arena
```

Tekan Enter.

Cek apakah kamu sudah di folder yang benar:

```powershell
pwd
```

Harus muncul: `C:\Users\bgxhg\catur-arena`

### 1.2 Cek status git

```powershell
git status
```

### 1.3 Tambahkan semua perubahan baru

```powershell
git add .
```

### 1.4 Buat commit

```powershell
git commit -m "update: redesign UI + live chat firebase + backup script"
```

Ganti pesan commit sesuai keinginanmu.

### 1.5 Push ke GitHub

```powershell
git push origin main
```

> Kalau branch kamu bukan `main`, ganti dengan `git branch` untuk cek, lalu `git push origin nama-branch-kamu`

Tunggu sampai selesai. Kalau berhasil, semua kode terbaru sudah di GitHub.

---

## LANGKAH 2: Masuk ke VPS via SSH

### 2.1 Dari PowerShell, SSH ke VPS

Ketik:

```powershell
ssh root@208.76.40.208
```

Pertama kali akan muncul pertanyaan "Are you sure you want to continue connecting (yes/no/[fingerprint])?"

Ketik `yes` lalu Enter.

Masukkan password root VPS kamu.

Setelah berhasil login, kamu akan melihat prompt seperti:

```
root@your-vps:~#
```

Sekarang kamu berada di **home folder root**: `/root`

---

## LANGKAH 3: Pindah ke User "catur" (User Normal untuk Project)

Jangan kerja sebagai root untuk project. Gunakan user `catur`.

Ketik perintah ini:

```bash
su - catur
```

Setelah itu, prompt akan berubah menjadi sesuatu seperti:

```
catur@your-vps:~$
```

**Sekarang kamu login sebagai user catur.**

---

## LANGKAH 4: Masuk ke Folder Project di VPS

Setelah `su - catur`, kamu berada di home user catur: `/home/catur`

### 4.1 Masuk ke folder project

Ketik:

```bash
cd ~/catur-arena
```

Atau cara panjang (sama saja):

```bash
cd /home/catur/catur-arena
```

Cek apakah kamu sudah di folder yang benar:

```bash
pwd
```

Harus muncul: `/home/catur/catur-arena`

Cek isi folder:

```bash
ls
```

Harus ada folder `client`, `server`, `rebuild-prod.sh`, dll.

---

## LANGKAH 5: Setup File Environment (HANYA SEKALI SAJA)

Ini penting supaya script rebuild otomatis tahu semua VITE_ termasuk Firebase.

### 5.1 Copy template

```bash
cp catur-build.env.example ~/catur-build.env
```

### 5.2 Edit file environment

```bash
nano ~/catur-build.env
```

Di dalam nano:

- Isi semua nilai yang benar.
- Khususnya 7 baris Firebase (ambil dari Firebase Console kamu).
- Simpan dengan: tekan **Ctrl + O** → Enter → lalu **Ctrl + X**

Contoh isi minimal:

```bash
export VITE_SERVER_URL=https://spingu.smkn1pulaurakyat.sch.id
export VITE_SATUCHAIN_RPC_URL=https://rpc-mainnet.satuchain.com
export VITE_SPINGU_CHESS_ESCROW=0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43
export VITE_SPINGU_TREASURY=0x600cFd2aCfD798B7f7bC5Fbbcc5FCe4a2A579684

export VITE_FIREBASE_API_KEY=AIzaSy...isi-yang-asli...
export VITE_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
export VITE_FIREBASE_DATABASE_URL=https://project-id-default-rtdb.asia-southeast1.firebasedatabase.app
export VITE_FIREBASE_PROJECT_ID=project-id
export VITE_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
export VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
export VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

### 5.3 Buat script rebuild executable (sekali saja)

```bash
cp rebuild-prod.sh .
chmod +x rebuild-prod.sh
```

Cek:

```bash
ls -l rebuild-prod.sh
```

Harus ada tanda `x` (executable).

---

## LANGKAH 6: Jalankan Update (Setiap Kali Mau Update)

Sekarang kamu sudah di folder `/home/catur/catur-arena`

Jalankan script rebuild yang otomatis backup + update:

```bash
./rebuild-prod.sh
```

Script akan:
- Otomatis backup dulu (lihat pesan "Creating automatic backup")
- Git pull
- Build backend
- Load env dari ~/catur-build.env
- Build frontend
- Restart PM2

Tunggu sampai selesai. Di akhir akan muncul pesan sukses + lokasi backup.

---

## LANGKAH 7: Cek Status

### Cek backend berjalan

```bash
pm2 status
```

Harus ada "catur-backend" dengan status "online".

### Lihat log terbaru (jika ada error)

```bash
pm2 logs catur-backend --lines 30
```

Tekan Ctrl + C untuk keluar dari log.

### Cek folder client sudah di-build

```bash
ls client/dist
```

Harus ada file `index.html` dan folder `assets`.

---

## LANGKAH 8: Restart Nginx (Jarang Perlu)

Kalau kamu yakin ada perubahan nginx (biasanya tidak):

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## LANGKAH 9: Test di Browser

Buka di komputer biasa dulu:

https://spingu.smkn1pulaurakyat.sch.id

Kemudian buka di **Bitget Wallet** di HP Android:

https://spingu.smkn1pulaurakyat.sch.id/spingu

Coba main game, buka tab Chat, connect wallet, dll.

---

## Cara Keluar dari VPS dengan Aman

Setelah selesai:

1. Keluar dari user catur:

```bash
exit
```

2. Keluar dari root:

```bash
exit
```

Kamu akan kembali ke PowerShell laptop.

---

## Troubleshooting Umum

**Masalah: "command not found" atau script tidak jalan**
- Pastikan kamu sudah `cd ~/catur-arena`
- Pastikan `chmod +x rebuild-prod.sh` sudah dijalankan

**Masalah: Chat tidak muncul**
- Cek apakah `~/catur-build.env` sudah diisi dengan Firebase yang benar
- Jalankan ulang `./rebuild-prod.sh`

**Masalah: Masih tampilan lama**
- Tekan Ctrl + Shift + R di browser (hard refresh)
- Atau buka di tab Incognito

**Ingin lihat backup yang dibuat**
```bash
ls -lh ~/backups/catur-arena/
```

**Rollback ke backup sebelumnya**
```bash
tar -xzf ~/backups/catur-arena/catur-arena-backup-2025...tar.gz -C ~
cd ~/catur-arena
./rebuild-prod.sh   # atau restart manual
```

---

## Ringkasan Perintah Penting (Cheatsheet) - Cara Bersih dari Awal

**Di Laptop Lokal (PowerShell) - Push dulu:**
```powershell
cd C:\Users\bgxhg\catur-arena
git add .
git commit -m "update clean"
git push
```

**Di VPS (sebagai catur):**
```bash
cd ~/catur-arena
git stash
git pull
chmod +x update-from-git.sh
./update-from-git.sh
```

Script di atas akan:
- Backup otomatis
- Pull
- Build server + client (dengan VITE_BASE_PATH=/catur/)
- Restart PM2

Lalu test di https://spingu.smkn1pulaurakyat.sch.id/catur + hard refresh.

Jika perlu edit env:
```bash
nano ~/catur-build.env
./update-from-git.sh
```

---

## Troubleshooting: "tsc: not found" saat build server (dari output kamu)

Ini error yang baru kamu dapat:

sh: 1: tsc: not found

**Penyebab:** Script pakai `npm ci --production` di server, yang skip devDependencies (typescript ada di situ, tsc adalah bin-nya).

**Fix sekarang (di VPS kamu):**

```bash
cd ~/catur-arena/server
npm ci
npm run build
```

Jika client juga perlu (dengan env yang benar termasuk VITE_BASE_PATH=/catur/ ):

```bash
source ~/catur-build.env
cd ../client
npm ci
npm run build
```

Restart:

```bash
cd ~/catur-arena/server
pm2 restart catur-backend
```

**Fix script untuk selamanya (supaya tidak error lagi):**

```bash
cd ~/catur-arena
sed -i 's/npm ci --production/npm ci/' rebuild-prod.sh
```

Lalu kamu bisa `./rebuild-prod.sh` lagi nanti, dan itu akan jalan.

Setelah build sukses, **hard refresh** di https://spingu.smkn1pulaurakyat.sch.id/catur dengan Ctrl+Shift+R.

Cek apakah perubahan UI (judul lebih simpel, tombol flat, papan wood klasik) sudah muncul.

Kirim output `ls -l client/dist/index.html` dan `date` setelah build jika masih bingung.

Ada juga "2 moderate severity vulnerabilities" dari npm audit — bisa diabaikan untuk sekarang, atau jalankan `npm audit fix --force` di server dan client jika mau (tapi hati-hati breaking).

Sekarang fix tsc dulu bro, jalankan perintah di atas.
---

Simpan file ini di laptop kamu. Ikuti nomor demi nomor.

Kalau ada yang error di langkah tertentu, copy paste error + langkah berapa, saya bantu langsung.

Sekarang coba ikuti dari LANGKAH 1. Semoga sukses! 

Kalau sudah selesai update, kasih tau hasilnya.

**Jika masih blank screen di https://spingu.smkn1pulaurakyat.sch.id/catur setelah semua update:**

Kemungkinan besar build belum pakai base /catur/ dengan benar (assets 404).

Jalankan quick fix:

```bash
cd ~/catur-arena
chmod +x fix-client-for-catur.sh
./fix-client-for-catur.sh
sudo systemctl reload nginx
```

Lalu hard refresh browser (Ctrl+Shift+R) di URL tersebut.

The fix script forces clean dist build with VITE_BASE_PATH=/catur/ and shows the script src paths.

If after that still blank, buka DevTools (F12) > Console and paste any error here.

Atau cek built paths:

```bash
grep -o 'src="[^"]*"' ~/catur-arena/client/dist/index.html | head -3
```

Harusnya ada /catur/assets/...

Kalau masih /assets/ , env tidak terbaca saat build.