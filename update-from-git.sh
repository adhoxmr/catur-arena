#!/bin/bash
#
# Clean Update Script from Git for Catur Arena on VPS
# Run this on VPS as catur user in ~/catur-arena
#
# It will:
# - Stash any local changes
# - Pull latest
# - Backup current
# - Setup env if missing (you still need to fill Firebase later)
# - Build server + client with correct base for /catur
# - Restart PM2
#

set -e

echo "=== Catur Arena - Clean Update from Git ==="

PROJECT_DIR="$HOME/catur-arena"
ENV_FILE="$HOME/catur-build.env"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "Error: Run from catur user, cd ~/catur-arena first"
  exit 1
fi

cd "$PROJECT_DIR"

echo "1. Stashing any local changes..."
git stash || true

echo "2. Pulling latest code..."
git pull --ff-only || git pull

echo "3. Creating backup (manual)..."
BACKUP_DIR="$HOME/backups/catur-arena"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar --exclude='node_modules' --exclude='.git' --exclude='backups' -czf "$BACKUP_DIR/catur-arena-backup-$TIMESTAMP.tar.gz" -C "$HOME" catur-arena 2>/dev/null || echo "Backup warning (non-fatal)"

echo "4. Setting up env file if not exists..."
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "catur-build.env.example" ]; then
    cp catur-build.env.example "$ENV_FILE"
    echo "   -> Created $ENV_FILE from example. EDIT IT NOW with real values (especially Firebase)!"
    echo "   -> Then re-run this script."
    exit 1
  else
    echo "   -> No example found. Creating minimal env..."
    cat > "$ENV_FILE" << 'EENV'
export VITE_SERVER_URL=https://spingu.smkn1pulaurakyat.sch.id
export VITE_BASE_PATH=/catur/
export VITE_SATUCHAIN_RPC_URL=https://rpc-mainnet.satuchain.com
export VITE_SPINGU_CHESS_ESCROW=0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43
export VITE_SPINGU_TREASURY=0x600cFd2aCfD798B7f7bC5Fbbcc5FCe4a2A579684
export VITE_FIREBASE_API_KEY=placeholder-isi-nanti
export VITE_FIREBASE_AUTH_DOMAIN=placeholder-isi-nanti
export VITE_FIREBASE_DATABASE_URL=placeholder-isi-nanti
export VITE_FIREBASE_PROJECT_ID=placeholder-isi-nanti
export VITE_FIREBASE_STORAGE_BUCKET=placeholder-isi-nanti
export VITE_FIREBASE_MESSAGING_SENDER_ID=placeholder-isi-nanti
export VITE_FIREBASE_APP_ID=placeholder-isi-nanti
EENV
    echo "   -> Created $ENV_FILE . EDIT IT with real Firebase values, then re-run this script."
    exit 1
  fi
fi

echo "5. Sourcing env..."
# shellcheck disable=SC1090
source "$ENV_FILE"

# Force base path for /catur subdir deployment
export VITE_BASE_PATH=/catur/

echo "6. Building Backend..."
cd server
npm ci
npm run build

echo "7. Building Frontend..."
cd ../client
npm ci
rm -rf dist
npm run build

echo "   -> Verifying base paths in built index.html..."
grep -o 'src="[^"]*"' dist/index.html | head -3 || echo "   (no src found, check build)"

echo "8. Restarting PM2..."
cd ../server
pm2 restart catur-backend || pm2 start dist/index.js --name catur-backend

echo "9. Updating Nginx config for /catur subpath and reloading..."
sudo cp nginx-catur.conf /etc/nginx/sites-available/catur || echo "Warning: could not cp nginx config (check sudo)"
sudo nginx -t && sudo systemctl reload nginx || true

echo "=== DONE ==="
echo "Test at: https://spingu.smkn1pulaurakyat.sch.id/catur"
echo "Hard refresh with Ctrl+Shift+R"
echo "Backup saved in $BACKUP_DIR"
echo ""
echo "If chat not working yet, edit $ENV_FILE with real Firebase keys and re-run this script."