# Production Deployment Guide for Catur Arena

**Your setup:**
- Domain: spingu.smkn1pulaurakyat.sch.id
- VPS public IP: 208.76.40.208
- Git: connected locally to adhoxmr (use the repo URL you have, e.g. https://github.com/adhoxmr/catur-arena.git)

## Quick VPS Commands (Ubuntu)

SSH to VPS:
ssh root@208.76.40.208

Update & install:
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx git
sudo npm install -g pm2

Create user:
sudo useradd -m -s /bin/bash catur
sudo usermod -aG sudo catur
su - catur

Clone:
cd ~
git clone https://github.com/adhoxmr/catur-arena.git   # change if your repo name is different
cd catur-arena

Backend:
cd server
npm ci --production=false
npm run build
cp .env.example .env
nano .env
# Put your real GAME_OPERATOR_PRIVATE_KEY here + CORS_ORIGIN=https://spingu.smkn1pulaurakyat.sch.id

Frontend build (prod):
cd ../client
npm ci
export VITE_SERVER_URL=https://spingu.smkn1pulaurakyat.sch.id
export VITE_SATUCHAIN_RPC_URL=https://rpc-mainnet.satuchain.com
export VITE_SPINGU_CHESS_ESCROW=0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43
export VITE_SPINGU_TREASURY=0x600cFd2aCfD798B7f7bC5Fbbcc5FCe4a2A579684
npm run build

PM2:
cd ~/catur-arena/server
pm2 start dist/index.js --name catur-backend
pm2 save
pm2 startup

Nginx (use the clean file we prepared):
sudo cp ~/catur-arena/nginx-catur.conf /etc/nginx/sites-available/catur
sudo ln -s /etc/nginx/sites-available/catur /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo nginx -t
sudo systemctl reload nginx

SSL:
sudo certbot --nginx -d spingu.smkn1pulaurakyat.sch.id

Firewall:
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

Done! Open https://spingu.smkn1pulaurakyat.sch.id/spingu in Bitget dApp browser.

## Cara Update (Setelah Perubahan Code di Lokal)

Ini yang kamu butuhkan sekarang (bukan setup ulang):

1. Dari laptop lokal, commit & push perubahan:
   ```powershell
   git add .
   git commit -m "update UI + fitur terbaru"
   git push
   ```

2. SSH ke VPS sebagai root atau su - catur

3. Pull code:
   ```bash
   cd ~/catur-arena
   git pull
   ```

4. Backend:
   ```bash
   cd server
   npm install
   npm run build
   pm2 restart catur-backend
   ```

5. Frontend (WAJIB set semua env termasuk Firebase yang baru):
   ```bash
   cd ../client
   npm install
   export VITE_SERVER_URL=https://spingu.smkn1pulaurakyat.sch.id
   export VITE_SATUCHAIN_RPC_URL=https://rpc-mainnet.satuchain.com
   export VITE_SPINGU_CHESS_ESCROW=0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43
   export VITE_SPINGU_TREASURY=0x600cFd2aCfD798B7f7bC5Fbbcc5FCe4a2A579684
   # Tambahkan 7 baris VITE_FIREBASE_* di sini (lihat CARA_UPDATE_VPS.md)
   npm run build
   ```

Lihat file **CARA_UPDATE_VPS.md** untuk panduan lengkap + contoh script rebuild yang lebih praktis.

See the rest of this file for full details if you want to understand every step.
