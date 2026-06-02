# Production Deployment Guide for Catur Arena (Tailored for your setup)

**Your info:**
- Domain: spingu.smkn1pulaurakyat.sch.id
- VPS IP: 208.76.40.208
- Git: adhoxmr (use https://github.com/adhoxmr/catur-arena.git or the exact one you connected)

## Prerequisites
- VPS Ubuntu 22.04+ at 208.76.40.208
- Domain with A record to 208.76.40.208 (HTTPS required for Bitget etc.)
- Node 20+
- Git

## 1. VPS Initial Setup (as root)

`ash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx git
sudo npm install -g pm2

# Create deploy user
sudo useradd -m -s /bin/bash catur
sudo usermod -aG sudo catur
sudo su - catur
`

## 2. Clone & Prepare

`ash
cd ~
git clone https://github.com/adhoxmr/catur-arena.git   # adjust if repo name different
cd catur-arena
`

## 3. Backend

`ash
cd server
npm ci --production=false
npm run build
cp .env.example .env
nano .env
# Edit: 
# - GAME_OPERATOR_PRIVATE_KEY = your real private key
# - CORS_ORIGIN=https://spingu.smkn1pulaurakyat.sch.id
# - other values as in your local .env
`

## 4. Frontend (build with prod env)

`ash
cd ../client
npm ci
export VITE_SERVER_URL=https://spingu.smkn1pulaurakyat.sch.id
export VITE_SATUCHAIN_RPC_URL=https://rpc-mainnet.satuchain.com
export VITE_SPINGU_CHESS_ESCROW=0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43
export VITE_SPINGU_TREASURY=0x600cFd2aCfD798B7f7bC5Fbbcc5FCe4a2A579684
npm run build
`

## 5. PM2 Backend

`ash
cd ~/catur-arena/server
pm2 start dist/index.js --name catur-backend
pm2 save
pm2 startup
`

## 6. Nginx + SSL

`ash
sudo cp ~/catur-arena/nginx-catur.conf /etc/nginx/sites-available/catur
sudo ln -s /etc/nginx/sites-available/catur /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo nginx -t
sudo systemctl reload nginx

sudo certbot --nginx -d spingu.smkn1pulaurakyat.sch.id
`

## 7. Firewall

`ash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
`

## 8. Test

- Open https://spingu.smkn1pulaurakyat.sch.id/spingu in Bitget dApp browser.
- Auto wallet connect should work.
- Real bets should go on-chain.

See full details in this file (we cleaned the guide).

For updates: git pull on VPS, rebuild, pm2 restart.
