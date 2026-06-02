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

Ketik perintah ini satu per satu:

```bash
git pull
```

Ini akan download file baru termasuk `rebuild-prod.sh`

Cek apakah sudah masuk:

```bash
ls
```

Harus muncul `rebuild-prod.sh` dan `catur-build.env.example`

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

## Ringkasan Perintah Penting (Cheatsheet)

**Lokal (PowerShell):**
```powershell
cd C:\Users\bgxhg\catur-arena
git add .
git commit -m "pesan"
git push
```

**VPS:**
```bash
ssh root@208.76.40.208          # masuk root
su - catur                       # pindah ke user catur
cd ~/catur-arena                 # masuk folder project
./rebuild-prod.sh                # update otomatis + backup
pm2 status                       # cek backend
pm2 logs catur-backend --lines 30 # lihat log
exit                             # keluar dari catur
exit                             # keluar dari root
```

---

Simpan file ini di laptop kamu. Ikuti nomor demi nomor.

Kalau ada yang error di langkah tertentu, copy paste error + langkah berapa, saya bantu langsung.

Sekarang coba ikuti dari LANGKAH 1. Semoga sukses! 

Kalau sudah selesai update, kasih tau hasilnya.