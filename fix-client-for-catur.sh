#!/bin/bash
# Quick fix to rebuild client with correct /catur base path
# Run on VPS as catur in ~/catur-arena

set -e

echo "=== Fixing client build for /catur subpath ==="

cd ~/catur-arena

# Ensure env with base
cat > ~/catur-build.env << 'EOF'
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
EOF

echo "Env file ready with VITE_BASE_PATH=/catur/"

# Build client
cd client
echo "Installing deps..."
npm ci

echo "Cleaning old dist..."
rm -rf dist

echo "Building with base /catur/ ..."
export VITE_BASE_PATH=/catur/
npm run build

echo "Verifying built paths..."
grep -o 'src="[^"]*"' dist/index.html | head -3

echo "Done. Now reload nginx and hard refresh browser."
echo "Commands:"
echo "sudo systemctl reload nginx"
echo "Then in browser: Ctrl+Shift+R on https://spingu.smkn1pulaurakyat.sch.id/catur"

# Optional: restart pm2 if backend needed
# cd ../server
# pm2 restart catur-backend || true