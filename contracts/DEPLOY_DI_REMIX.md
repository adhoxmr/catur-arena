# Cara Deploy SpinguChessEscrow di Remix (Paling Mudah)

## Langkah-langkah Deploy di https://remix.ethereum.org/

### 1. Buka Remix
Buka website ini: **https://remix.ethereum.org/**

### 2. Buat File Baru
- Di sebelah kiri, klik icon **"Create new file"** (icon kertas + tanda +)
- Beri nama file: `SpinguChessEscrow.sol`

### 3. Copy Isi Contract
- Buka file `SpinguChessEscrow_Remix.sol` yang sudah saya buatkan
- Copy **SELURUH isi** file tersebut
- Paste ke Remix

### 4. Compile Contract
- Pindah ke tab **Solidity Compiler** (icon "S" di sebelah kiri)
- Pastikan Compiler Version = **0.8.20** atau **0.8.21**
- Klik tombol **"Compile SpinguChessEscrow.sol"**
- Tunggu sampai muncul tanda hijau "Compilation successful"

### 5. Siapkan MetaMask (PENTING)

Pastikan MetaMask kamu sudah:
- Terinstall
- Sudah connect ke **jaringan SatuChain**

Jika belum punya SatuChain di MetaMask, tambahkan manual:

**Network Name**: SatuChain  
**RPC URL**: (isi dengan RPC SatuChain kamu)  
**Chain ID**: 0x1583c088b93de3019927abdf0fba35b3946f8e94  
**Currency Symbol**: SPINGU (atau sesuai native token SatuChain)  
**Block Explorer URL**: (opsional)

### 6. Deploy Contract

- Pindah ke tab **Deploy & Run Transactions** (icon "D" di sebelah kiri)
- Di bagian **Environment**, pilih:
  > **Injected Provider - MetaMask**
- Pastikan akun MetaMask yang muncul adalah akun yang benar
- Pastikan network di MetaMask sudah SatuChain

### 7. Isi Constructor Parameters (Paling Penting!)

Di bagian **Deploy**, kamu akan melihat 3 input:

1. **_spinguToken**
   - Isi dengan: `0xb6248d93cf91b00b79fae46d3d4a8b50ac04fd3b`

2. **_feeCollector**
   - Ini adalah alamat **Treasury / Wallet yang menerima 3% fee**
   - **GANTI** dengan alamat wallet treasury kamu yang sebenarnya
   - Contoh: `0x1234567890abcdef1234567890abcdef12345678`

3. **_gameOperator**
   - Ini adalah alamat **Backend Wallet** yang akan resolve game (paling penting)
   - Wallet ini harus punya private key di server kamu nanti
   - **GANTI** dengan alamat wallet backend kamu

### 8. Klik Deploy

- Klik tombol **"Deploy"** (warna oranye)
- MetaMask akan muncul → klik **Confirm**
- Tunggu beberapa detik
- Setelah berhasil, alamat contract akan muncul di bawah

### 9. Simpan Alamat Contract

Setelah deploy berhasil, **salin alamat contract** yang muncul.

Contoh:
```
0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0
```

Alamat ini nanti harus kamu masukkan ke file:
- `catur-arena/client/.env.local` sebagai `VITE_SPINGU_CHESS_ESCROW`

---

## Catatan Penting

- Jangan deploy dengan alamat `0x0000...` sebagai feeCollector atau gameOperator.
- Setelah deploy, kamu bisa panggil fungsi `setGameOperator` dan `setFeeCollector` kapan saja (hanya owner yang bisa).
- Simpan private key dari `gameOperator` dengan aman di backend kamu.

---

## Setelah Deploy

1. Copy alamat contract
2. Masukkan ke `client/.env.local`:
   ```env
   VITE_SPINGU_CHESS_ESCROW=0xHasilDeployKamuDisini
   ```
3. Restart frontend

Mau saya bantu buatkan juga contoh kode backend untuk memanggil contract ini?
