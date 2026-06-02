#!/bin/bash
set -e

DOMAIN="spingu.smkn1pulaurakyat.sch.id"
REPO_URL="https://github.com/adhoxmr/catur-arena.git"
DEPLOY_USER="catur"

echo "=== Catur Arena VPS Setup ==="
echo "Domain: $DOMAIN"

if [ "$EUID" -ne 0 ]; then
  echo "Run as root: sudo ./vps-setup.sh"
  exit 1
fi

apt-get update && apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx certbot python3-certbot-nginx git
npm install -g pm2

if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$DEPLOY_USER
fi

su - "$DEPLOY_USER" -c "
  cd ~
  if [ ! -d catur-arena ]; then
    git clone $REPO_URL catur-arena
  else
    cd catur-arena && git pull
  fi
"

su - "$DEPLOY_USER" -c '
  cd ~/catur-arena/server
  npm ci --production=false
  npm run build
  if [ ! -f .env ]; then
    cp .env.example .env
    echo ">>> EDIT .env with real private key and CORS_ORIGIN=https://$DOMAIN"
  fi
'

su - "$DEPLOY_USER" -c '
  cd ~/catur-arena/client
  npm ci
  export VITE_SERVER_URL=https://$DOMAIN
  export VITE_SATUCHAIN_RPC_URL=https://rpc-mainnet.satuchain.com
  export VITE_SPINGU_CHESS_ESCROW=0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43
  export VITE_SPINGU_TREASURY=0x600cFd2aCfD798B7f7bC5Fbbcc5FCe4a2A579684

  # Firebase (Live Chat) - ganti dengan nilai asli kamu
  export VITE_FIREBASE_API_KEY=your-firebase-api-key
  export VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
  export VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app
  export VITE_FIREBASE_PROJECT_ID=your-project-id
  export VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
  export VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
  export VITE_FIREBASE_APP_ID=1:1234567890:web:xxxxxxxxxxxxxxxx

  npm run build
'

su - "$DEPLOY_USER" -c '
  cd ~/catur-arena/server
  pm2 start dist/index.js --name catur-backend || true
  pm2 save || true
'

if [ -f /home/$DEPLOY_USER/catur-arena/nginx-catur.conf ]; then
  cp /home/$DEPLOY_USER/catur-arena/nginx-catur.conf /etc/nginx/sites-available/catur
fi
ln -sf /etc/nginx/sites-available/catur /etc/nginx/sites-enabled/
nginx -t || true
systemctl reload nginx || true

certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@smkn1pulaurakyat.sch.id || echo "Run certbot manually if needed"

ufw allow "Nginx Full" || true
ufw allow OpenSSH || true
ufw --force enable || true

echo "=== COMPLETE ==="
echo "Edit .env with real key, rebuild if needed, test https://$DOMAIN/spingu"
