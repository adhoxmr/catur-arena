# Cara Update Game ke VPS (Setelah Perubahan Besar)

**Untuk panduan SUPER DETAIL step-by-step (termasuk setiap perintah "cd" dan cara masuk folder), baca file ini dulu:**

📄 **STEP_BY_STEP_VPS_UPDATE.md**

File itu berisi instruksi nomor per nomor dari laptop sampai selesai di VPS.

Game kamu sudah di-perbaiki sempurna + tampilan diubah jadi lebih "manusia programmer" (clean, fungsional, klasik, tidak flashy).

**Fitur Baru di Script Update:**
- **Otomatis backup dulu** sebelum rebuild (full project backup + auto cleanup old backups)
- Hanya 1 perintah untuk update lengkap
- Mudah rollback kalau ada masalah

**Langkah Update (bukan install ulang):**

## 1. Dari Laptop Lokal (Push Perubahan Terbaru)

Pastikan kamu sudah di folder proyek:

```powershell
cd catur-arena
```

Commit dan push semua perubahan terbaru (redesign + chat Firebase + fix):

```powershell
git add .
git commit -m "update: redesign UI klasik + live chat firebase + perbaikan sempurna"
git push origin main
```

> Ganti `main` kalau branch kamu beda (cek dengan `git branch`).

## 2. SSH ke VPS

```powershell
ssh root@208.76.40.208
```

Atau kalau kamu sudah setup user `catur`:

```bash
su - catur
```

## 3. Update Code di VPS

```bash
cd ~/catur-arena
git pull origin main
```

## 4. Update Backend (Server)

```bash
cd ~/catur-arena/server

# Install dependency baru (kalau ada)
npm install

# Build ulang
npm run build

# Restart PM2
pm2 restart catur-backend
```

Cek log kalau perlu:
```bash
pm2 logs catur-backend --lines 50
```

## 5. Update Frontend + Build (Versi Otomatis + Auto Backup - Direkomendasikan)

Script sekarang **otomatis backup dulu** sebelum melakukan perubahan apapun.

### Langkah Sekali Saja (Setup Otomatis)

Di VPS:

```bash
cd ~/catur-arena

# 1. Buat file environment (sekali saja)
cp catur-build.env.example ~/catur-build.env
nano ~/catur-build.env     # Isi semua nilai asli (khususnya Firebase)

# 2. Siapkan script rebuild
cp rebuild-prod.sh .
chmod +x rebuild-prod.sh
```

### Setiap Kali Update (1 Perintah Saja)

```bash
cd ~/catur-arena
./rebuild-prod.sh
```

**Apa yang dilakukan script secara otomatis:**

1. **Backup otomatis** dulu (sebelum git pull atau build)
   - Backup seluruh project (source + current dist)
   - Disimpan di `~/backups/catur-arena/catur-arena-backup-YYYYMMDD_HHMMSS.tar.gz`
   - Otomatis hapus backup lama (hanya simpan 5 backup terakhir)

2. `git pull`

3. Build backend + npm install

4. Load env dari `~/catur-build.env` (termasuk semua Firebase)

5. Build frontend

6. Restart PM2

7. Tampilkan lokasi backup terbaru + cara rollback jika perlu

### Cara Rollback jika ada masalah

```bash
# Lihat backup yang ada
ls -lh ~/backups/catur-arena/

# Rollback ke backup tertentu (contoh)
tar -xzf ~/backups/catur-arena/catur-arena-backup-20250410_143022.tar.gz -C ~

# Lalu rebuild lagi atau restart manual
cd ~/catur-arena/server
pm2 restart catur-backend
```

Sangat aman karena backup dilakukan **sebelum** perubahan apapun.

## 6. Restart Nginx (jika perlu)

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Test

Buka di browser biasa dulu:
https://spingu.smkn1pulaurakyat.sch.id

Kemudian test di **Bitget Wallet dApp browser** di HP Android:
https://spingu.smkn1pulaurakyat.sch.id/spingu

Cek:
- Tampilan baru (lebih clean)
- Main game
- Buka tab Chat Live
- Coba connect wallet + taruhan (kalau mau test real)

## Cara Lebih Cepat di Masa Depan (Update Kecil)

Kalau cuma perubahan kecil:

```bash
# Di lokal
git add .
git commit -m "fix something"
git push

# Di VPS (sebagai user catur)
cd ~/catur-arena
git pull
cd client && npm run build
cd ../server && npm run build && pm2 restart catur-backend
```

## Troubleshooting Update

- **Chat tidak muncul**: Pastikan semua `VITE_FIREBASE_*` di-export sebelum `npm run build` di client. Restart browser.
- **Error build**: Pastikan `npm install` dijalankan setelah `git pull`.
- **Backend tidak jalan**: `pm2 logs catur-backend` untuk lihat error.
- **Masih tampilan lama**: Hard refresh browser (Ctrl + Shift + R) atau clear cache.
- **Env hilang setiap rebuild**: Buat file script kecil di VPS, misalnya:

Buat file `~/rebuild.sh`:

```bash
#!/bin/bash
cd ~/catur-arena/client
export VITE_SERVER_URL=...
export VITE_FIREBASE_API_KEY=...
# ... semua export
npm run build
cd ../server
npm run build
pm2 restart catur-backend
echo "Update selesai"
```

Lalu `chmod +x ~/rebuild.sh` dan jalankan `./rebuild.sh` setiap update.

## Setelah Update

Kalau semuanya jalan bagus, kamu bisa kasih tau user untuk main di domain HTTPS.

Kalau ada error, copy paste error di sini, saya bantu perbaiki.

Sekarang game kamu sudah di VPS dengan versi paling baru & tampilan yang lebih natural.

---

## File Baru yang Ditambahkan

- `rebuild-prod.sh` → Script rebuild otomatis
- `catur-build.env.example` → Template untuk env production (copy ke `~/catur-build.env`)
- `CARA_UPDATE_VPS.md` → Panduan ini

Jangan lupa tambahkan `catur-build.env` ke `.gitignore` (sudah saya lakukan).
