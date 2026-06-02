#!/bin/bash
#
# Automatic Rebuild Script for Catur Arena (Production)
# VERSI DENGAN BACKUP OTOMATIS SEBELUM REBUILD
#
# Cara pakai:
# 1. Copy file ini ke VPS: ~/catur-arena/rebuild-prod.sh
# 2. Buat file env sekali saja: ~/catur-build.env (copy dari catur-build.env.example)
# 3. chmod +x rebuild-prod.sh
# 4. Jalankan: ./rebuild-prod.sh
#
# Yang dilakukan script (otomatis):
# 1. BACKUP penuh project (sebelum sentuh apapun)
# 2. git pull
# 3. npm install + build backend
# 4. Load env dari ~/catur-build.env
# 5. npm install + build frontend
# 6. pm2 restart
# 7. Cleanup backup lama (keep last 5)
#
# Backup disimpan di:
# ~/backups/catur-arena/catur-arena-backup-YYYYMMDD_HHMMSS.tar.gz
#
# Rollback contoh:
# tar -xzf ~/backups/catur-arena/catur-arena-backup-XXXX.tar.gz -C ~


set -e

echo "========================================"
echo "  Catur Arena - Automatic Rebuild (with Backup)"
echo "========================================"

PROJECT_DIR="$HOME/catur-arena"
ENV_FILE="$HOME/catur-build.env"
BACKUP_DIR="$HOME/backups/catur-arena"

# Pastikan kita di direktori project
if [ ! -d "$PROJECT_DIR" ]; then
  echo "Error: Folder $PROJECT_DIR tidak ditemukan!"
  exit 1
fi

cd "$PROJECT_DIR"

# ============================================
# 0. AUTOMATIC BACKUP SEBELUM REBUILD
# ============================================
echo ""
echo "[0/6] Creating automatic backup BEFORE any changes..."

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/catur-arena-backup-$TIMESTAMP.tar.gz"

# Backup seluruh project, exclude node_modules dan .git supaya tidak terlalu besar
# Include current dist (built files) dan source code
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backups' \
    -czf "$BACKUP_FILE" -C "$HOME" catur-arena 2>/dev/null || {
  echo "   Warning: Backup completed with some warnings (non-critical)"
}

if [ -f "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "   -> ✅ Backup saved: $BACKUP_FILE ($BACKUP_SIZE)"
else
  echo "   -> ⚠️  Backup file not created, continuing anyway..."
fi

# Otomatis hapus backup lama, keep only last 5
echo "   -> Cleaning old backups (keeping latest 5)..."
ls -t "$BACKUP_DIR"/catur-arena-backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f

# ============================================
# 1. Git Pull
# ============================================
echo ""
echo "[1/6] Git pull latest code..."
git pull --ff-only || git pull

# ============================================
# 2. Backend Build
# ============================================
echo ""
echo "[2/6] Building Backend..."
cd server
npm ci
npm run build

# ============================================
# 3. Load Environment (otomatis dari file)
# ============================================
echo ""
echo "[3/6] Loading production environment..."
cd "$PROJECT_DIR"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  echo "   -> Environment loaded from $ENV_FILE"
else
  echo "   WARNING: $ENV_FILE tidak ditemukan!"
  echo ""
  echo "   Buat file ~/catur-build.env dengan perintah:"
  echo "   cp catur-build.env.example ~/catur-build.env"
  echo "   nano ~/catur-build.env"
  echo ""
  echo "   Catatan: Nilai Firebase BISA diisi nanti. Kamu boleh jalankan rebuild dulu dengan placeholder,"
  echo "   lalu edit ~/catur-build.env nanti dan jalankan ./rebuild-prod.sh lagi."
  echo ""
  read -p "Lanjutkan dengan env yang sudah di-export? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Dibatalkan."
    exit 1
  fi
fi

# ============================================
# 4. Frontend Build
# ============================================
echo ""
echo "[4/6] Building Frontend..."
cd client
npm ci
npm run build

# ============================================
# 5. Restart PM2
# ============================================
echo ""
echo "[5/6] Restarting Backend via PM2..."
cd "$PROJECT_DIR/server"
pm2 restart catur-backend || pm2 start dist/index.js --name catur-backend

# ============================================
# 6. Selesai + Info Backup
# ============================================
echo ""
echo "[6/6] Cleanup & Summary..."
echo "   -> Latest backup: $BACKUP_FILE"
echo "   -> All previous backups: ls -lh $BACKUP_DIR"

echo ""
echo "========================================"
echo "  ✅ Rebuild + Backup selesai!"
echo "========================================"
echo ""
echo "Test di: https://spingu.smkn1pulaurakyat.sch.id"
echo "Atau di Bitget Wallet: buka halaman /spingu"
echo ""
echo "Log backend     : pm2 logs catur-backend --lines 30"
echo "Lihat backups   : ls -lh $BACKUP_DIR"
echo "Rollback backup : tar -xzf $BACKUP_FILE -C ~"
echo ""