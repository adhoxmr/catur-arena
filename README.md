# 🏆 Catur Arena

Game catur profesional layaknya chess.com / lichess dengan fitur lengkap:

- ✅ Lawan AI 3 level (Pemula, Menengah, Master) dengan minimax + alpha-beta
- ✅ Multiplayer online real-time via Socket.io
- ✅ Taruhan token dengan sistem payout otomatis
- ✅ Timer, captured pieces, move history, resign, draw offer
- ✅ Sistem auth + dompet token persisten (SQLite)

## Cara Menjalankan

### 1. Install semua dependency

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Jalankan Server (wajib untuk fitur online)

```bash
cd server
npm run dev
```

Server berjalan di `http://localhost:4000`

### 3. Jalankan Frontend

```bash
cd client
npm run dev
```

Buka http://localhost:5173

### Akun Demo

- Username: `demo` | Password: `demo123` (memiliki 12.500 token)
- Username: `master` | Password: `chess2025`

Atau login sebagai tamu langsung dari homepage.

## Fitur Utama

### VS AI
- 3 tingkat kesulitan dengan algoritma catur yang kuat
- Timer, captured pieces, full chess rules
- Bonus token saat menang

### Online + Taruhan
- Buat room dengan taruhan berapa saja
- Join room terbuka atau pakai kode privat
- Pemenang mengambil hampir seluruh pot (fee 5%)
- Real-time sinkronisasi via WebSocket

### Dompet
- Bonus harian
- Beli token (demo)
- Riwayat transaksi

## Arsitektur

- **Frontend**: React 19 + Vite + TypeScript + Tailwind v4 + react-chessboard + chess.js + Socket.io-client + ethers.js v6
- **Backend**: Express + Socket.io + better-sqlite3 + JWT
- **AI**: Minimax dengan alpha-beta pruning + Piece-Square Tables (dibuat dari nol)
- **On-chain**: Spingu Token (ERC-20) di SatuChain

## Integrasi Spingu Token (On-Chain)

Game sekarang mendukung taruhan **Spingu Token asli**:

1. Pemain menghubungkan wallet EVM (MetaMask)
2. Beralih otomatis ke jaringan SatuChain
3. Pilih jumlah taruhan → Approve → Transfer ke Treasury
4. **Lawan AI Spingu**: Treasury otomatis match taruhan yang sama
5. **Multiplayer**: Pemain saling bertaruh Spingu asli
6. Potongan **3%** sebagai sewa Game Spingu

### Konfigurasi Wajib

Buat file `client/.env.local`:

```bash
VITE_SATUCHAIN_RPC_URL=https://rpc.satuchain-mu.com
VITE_SPINGU_TREASURY=0x1234...TreasuryKamu
```

Isi nilai:
- `VITE_SATUCHAIN_RPC_URL` → RPC SatuChain yang benar
- `VITE_SPINGU_TREASURY` → Alamat wallet yang akan match taruhan AI + terima fee 3%

Token Spingu: `0xb6248d93cf91b00b79fae46d3d4a8b50ac04fd3b`

Chain ID SatuChain: `0x1583c088b93de3019927abdf0fba35b3946f8e94`

## Pengembangan Selanjutnya (Roadmap)

- Integrasi Stockfish WASM untuk AI lebih kuat
- Sistem rating Elo yang akurat
- Matchmaking otomatis berdasarkan rating
- Chat dalam game
- Riwayat pertandingan & PGN export
- Mobile responsive yang lebih baik

## Smart Contract Escrow (Sudah Dibuat)

Lihat folder `/contracts`

Contract `SpinguChessEscrow.sol` sudah siap digunakan:
- Support AI match + Multiplayer
- 3% fee otomatis
- Hanya backend (gameOperator) yang bisa resolve hasil

Jalankan:
```bash
cd contracts
npm install
cp .env.example .env
# edit .env
npx hardhat compile
npx hardhat run scripts/deploy.ts --network satuchain
```

---

Selamat bermain! ♟️
