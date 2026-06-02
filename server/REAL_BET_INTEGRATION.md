# Real Spingu Token Integration - Backend

Contract berhasil di-deploy di: **0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43**

## Langkah Setup

### 1. Buat / Update `server/.env`

```env
PORT=4000
JWT_SECRET=catur-arena-super-secret-change-me

# === Spingu Real Token ===
SPINGU_TOKEN_ADDRESS=0xb6248d93cf91b00b79fae46d3d4a8b50ac04fd3b
SPINGU_CHESS_ESCROW=0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43

SATUCHAIN_RPC_URL=https://your-satuchain-rpc.example.com

# Private key dari Backend Operator wallet
GAME_OPERATOR_PRIVATE_KEY=0x17fc2ab56276553d6a1737cdd7657069c8595fa0ed43acef099e71510d106fb4

FEE_COLLECTOR_ADDRESS=0xC6239F498257BdeF5881D73c0cd4C0745D4A45eB
```

### 2. Restart Backend

```bash
cd server
npm run dev
```

Kamu akan melihat log:
```
✅ Blockchain service initialized
   Escrow Contract: 0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43
   Operator Address: 0x4aAbC1203F44B9099C2567aDa1d328a5da0d43b9
🚀 Catur Arena Server running on http://localhost:4000
   🔗 Real Spingu Token betting is ENABLED
```

## Bagaimana Backend Bekerja Sekarang

### Saat User Membuat Real Bet Game (dari halaman /spingu)

Frontend mengirim ke `join-room` dengan parameter tambahan:

```ts
socket.emit('join-room', {
  roomId: 'RM-1234',
  username: 'player1',
  stake: 100,
  isRealBet: true,
  playerAddress: '0xUserWalletAddress',
  treasuryAddress: '0xC6239F498257BdeF5881D73c0cd4C0745D4A45eB'  // untuk mode AI
})
```

Backend akan otomatis memanggil `createGame` di smart contract.

### Saat Game Selesai

Frontend mengirim event `game-over` dengan:

```ts
socket.emit('game-over', {
  roomId: 'RM-1234',
  reason: 'Skakmat',
  winnerAddress: '0xAlamatPemenang',
  winnerUsername: 'namaPemenang'
})
```

Backend akan memanggil `resolveGame` di contract → otomatis transfer kemenangan + potong 3% fee.

## Penting untuk Frontend

Di halaman `SpinguArenaPage.tsx`, pastikan saat join room kamu mengirim:

- `isRealBet: true`
- `playerAddress`: alamat wallet yang sedang connect
- `treasuryAddress`: alamat treasury (bisa hardcode `0xC6239F498257BdeF5881D73c0cd4C0745D4A45eB` untuk testing)

## Testing Flow (Real Bet)

1. User connect wallet di frontend
2. Pilih jumlah taruhan di `/spingu`
3. Frontend approve + deposit ke escrow
4. Backend otomatis create game di contract saat join-room
5. Main catur
6. Saat selesai → backend resolve game → uang berpindah on-chain

---

Contract Address: `0x71AbEC8c9eD67B73432F2CDDe399E017E2286b43`
