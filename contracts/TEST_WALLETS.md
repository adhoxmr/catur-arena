# 🔐 TEST WALLETS untuk Spingu Chess Escrow

**PERINGATAN KERAS:**
- Wallet ini dibuat khusus untuk **testing / development** di SatuChain.
- **JANGAN PERNAH** menggunakan private key ini di mainnet, production, atau dengan dana sungguhan.
- Private key ini sekarang sudah terekspos di repository ini.
- Setelah testing selesai, **buat wallet baru** untuk production.

---

## 1. TREASURY WALLET (FEE_COLLECTOR)

Alamat ini akan menerima **3% fee** dari setiap pertandingan.

- **Address**: `0xC6239F498257BdeF5881D73c0cd4C0745D4A45eB`
- **Private Key**: `0x5ef3a94bf5473ba35aa7994a2a8ff4562841ed4fbe110fb0482055b697087531`

**Gunakan alamat ini** untuk:
- Parameter `_feeCollector` saat deploy contract di Remix

---

## 2. BACKEND OPERATOR WALLET (GAME_OPERATOR)

Alamat ini adalah yang akan **resolve game** (menentukan pemenang dan memicu payout).

- **Address**: `0x4aAbC1203F44B9099C2567aDa1d328a5da0d43b9`
- **Private Key**: `0x17fc2ab56276553d6a1737cdd7657069c8595fa0ed43acef099e71510d106fb4`

**Gunakan alamat ini** untuk:
- Parameter `_gameOperator` saat deploy contract di Remix
- Private key ini akan dimasukkan ke backend server

---

## Cara Menggunakan di Deploy Remix

Saat deploy contract `SpinguChessEscrow_Remix.sol` di Remix, isi seperti ini:

| Parameter       | Isi dengan                                      |
|-----------------|-------------------------------------------------|
| `_spinguToken`  | `0xb6248d93cf91b00b79fae46d3d4a8b50ac04fd3b`   |
| `_feeCollector` | `0xC6239F498257BdeF5881D73c0cd4C0745D4A45eB`   |
| `_gameOperator` | `0x4aAbC1203F44B9099C2567aDa1d328a5da0d43b9`   |

---

## Konfigurasi di Backend (.env)

Buat file `server/.env` dan isi:

```env
# Spingu Token
SPINGU_TOKEN_ADDRESS=0xb6248d93cf91b00b79fae46d3d4a8b50ac04fd3b

# Escrow Contract (isi setelah deploy di Remix)
SPINGU_CHESS_ESCROW=0x...isi alamat contract hasil deploy...

# Backend Operator Private Key (untuk resolve game)
GAME_OPERATOR_PRIVATE_KEY=0x17fc2ab56276553d6a1737cdd7657069c8595fa0ed43acef099e71510d106fb4

# RPC SatuChain
SATUCHAIN_RPC_URL=https://your-satuchain-rpc.example.com
```

**PENTING:**
- File `.env` **jangan pernah di-commit** ke Git.
- Tambahkan `.env` ke `.gitignore`

---

## Langkah Selanjutnya Setelah Deploy

1. Deploy contract di Remix menggunakan 3 alamat di atas.
2. Copy alamat contract hasil deploy.
3. Masukkan ke `server/.env` sebagai `SPINGU_CHESS_ESCROW`.
4. Masukkan private key operator ke `GAME_OPERATOR_PRIVATE_KEY`.
5. **Fund** kedua wallet di atas dengan Spingu Token di SatuChain (minimal untuk testing).

---

## Rekomendasi Keamanan (Production Nanti)

Saat sudah mau production:
- Buat wallet baru menggunakan MetaMask / hardware wallet.
- Jangan pakai wallet test ini lagi.
- Gunakan environment variable yang aman (misalnya AWS Secrets Manager, Doppler, atau Vercel Env).
- Pertimbangkan menggunakan **multisig** untuk treasury.

Generated on: 2026-06-01 (untuk testing only)
