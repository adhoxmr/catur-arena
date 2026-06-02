# Spingu Chess Escrow Smart Contract

Smart contract escrow untuk taruhan Spingu Token pada game Catur Arena di SatuChain.

## Fitur

- Mendukung taruhan **Lawan AI Spingu** (treasury match)
- Mendukung **Multiplayer** real token
- Potongan fee **3%** otomatis ke `feeCollector`
- Hanya `gameOperator` (backend) yang bisa resolve game
- Reentrancy protected + Ownable2Step

## Deployment

```bash
cd contracts
npm install

# Buat file .env
cp .env.example .env
# Edit .env dengan RPC, private key, dan alamat treasury + operator

npx hardhat compile
npx hardhat run scripts/deploy.ts --network satuchain
```

## Integrasi Frontend

Setelah deploy, tambahkan alamat contract ke frontend:

```ts
// src/lib/satuchain.ts
export const SPINGU_CHESS_ESCROW = "0x...alamat contract hasil deploy...";
```

Kemudian expose fungsi `deposit`, `createGame`, `resolveGame` (hanya operator yang call resolve).

## Alur Penggunaan

### 1. Lawan AI Spingu
1. Backend memanggil `createGame(gameId, player, treasuryAddress, betAmount, VS_AI)`
2. Pemain approve + `deposit(gameId)`
3. Backend (operator) memanggil `fundAIMatch(gameId)` untuk match dari treasury
4. Setelah game selesai → backend memanggil `resolveGame(gameId, winnerAddress)`

### 2. Multiplayer
1. Backend create game
2. Kedua pemain deposit
3. Setelah selesai → `resolveGame`

## Keamanan

- Jangan pernah expose private key `gameOperator` di frontend.
- Gunakan multisig atau timelock untuk owner jika memungkinkan.
- Pertimbangkan upgradeability (UUPS) di versi berikutnya.

## Lisensi

MIT
