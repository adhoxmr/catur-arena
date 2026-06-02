import { ethers } from 'ethers'

// ============================================================
// SPINGU TOKEN + SATUCHAIN CONFIG
// ============================================================
// TODO: Isi nilai yang benar dari tim SatuChain

export const SPINGU_TOKEN_ADDRESS = '0xb6248d93cf91b00b79fae46d3d4a8b50ac04fd3b'

// Chain ID SatuChain (dari user)
export const SATUCHAIN_CHAIN_ID_HEX = '0x1583c088b93de3019927abdf0fba35b3946f8e94'
export const SATUCHAIN_CHAIN_ID = BigInt(SATUCHAIN_CHAIN_ID_HEX)

// GANTI DENGAN RPC YANG BENAR
export const SATUCHAIN_RPC_URL = import.meta.env.VITE_SATUCHAIN_RPC_URL || 
  'https://rpc.satuchain.xyz' // <--- GANTI INI

export const SATUCHAIN_EXPLORER = import.meta.env.VITE_SATUCHAIN_EXPLORER || 
  'https://explorer.satuchain.xyz' // optional

// Alamat treasury / hot wallet yang akan:
// - Menerima 3% fee
// - Match taruhan saat lawan AI Spingu
// - Mengirim kemenangan ke pemain
export const SPINGU_TREASURY_ADDRESS = import.meta.env.VITE_SPINGU_TREASURY || 
  '0x0000000000000000000000000000000000000000' // <--- WAJIB GANTI

// Nama & symbol native token SatuChain (biasanya SPINGU atau SATU)
export const NATIVE_CURRENCY = {
  name: 'Spingu',
  symbol: 'SPINGU',
  decimals: 18,
}

export const SPINGU_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const

// Game fee 3%
export const GAME_FEE_PERCENT = 3

export function calculateFee(amount: bigint): bigint {
  return (amount * BigInt(GAME_FEE_PERCENT)) / BigInt(100)
}

export function calculatePayoutForWinner(betAmount: bigint): bigint {
  // Pemenang dapat (2 * bet - fee)
  const totalPot = betAmount * BigInt(2)
  const fee = calculateFee(totalPot)
  return totalPot - fee
}

// Helper: format token dengan desimal
export function formatSpingu(amount: bigint | string, decimals = 18): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount
  return ethers.formatUnits(value, decimals)
}

export function parseSpingu(amount: string, decimals = 18): bigint {
  return ethers.parseUnits(amount, decimals)
}

// ============================================================
// NETWORK HELPERS
// ============================================================
declare global {
  interface Window {
    ethereum?: any
    bitget?: {
      ethereum?: any
    }
  }
}

function getEthereumProvider(): any {
  if (typeof window === 'undefined') return null

  // Prefer Bitget Wallet if available (common in some regions)
  if (window.bitget?.ethereum) {
    return window.bitget.ethereum
  }

  // Check for Bitget injected directly
  if (window.ethereum?.isBitget) {
    return window.ethereum
  }

  // Fallback to standard injected provider (MetaMask, Trust, etc.)
  if (window.ethereum) {
    return window.ethereum
  }

  return null
}

export async function getProvider(): Promise<ethers.BrowserProvider> {
  const provider = getEthereumProvider()
  if (!provider) {
    throw new Error('Wallet EVM tidak ditemukan. Buka dApp ini di dalam browser Bitget Wallet (atau MetaMask), atau install ekstensi wallet EVM.')
  }
  return new ethers.BrowserProvider(provider)
}

export async function connectWallet() {
  const provider = await getProvider()
  // Request accounts (this will prompt the wallet if not connected)
  await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  const address = await signer.getAddress()
  return { address, signer, provider }
}

/**
 * Silent connect - tries to connect without prompting if user already authorized the dapp.
 * Useful for auto-connect on page load.
 */
export async function trySilentConnect(): Promise<{ address: string; signer: ethers.JsonRpcSigner; provider: ethers.BrowserProvider } | null> {
  const provider = await getProvider()
  const accounts = await provider.send('eth_accounts', [])
  
  if (accounts && accounts.length > 0) {
    const signer = await provider.getSigner()
    const address = accounts[0]
    return { address, signer, provider }
  }
  return null
}

export async function switchToSatuChain() {
  const provider = getEthereumProvider()
  if (!provider) throw new Error('Wallet EVM tidak ditemukan')

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SATUCHAIN_CHAIN_ID_HEX }],
    })
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: SATUCHAIN_CHAIN_ID_HEX,
          chainName: 'SatuChain',
          nativeCurrency: NATIVE_CURRENCY,
          rpcUrls: [SATUCHAIN_RPC_URL],
          blockExplorerUrls: SATUCHAIN_EXPLORER ? [SATUCHAIN_EXPLORER] : [],
        }],
      })
    } else {
      throw switchError
    }
  }
}

export async function getSpinguBalance(address: string): Promise<bigint> {
  const provider = await getProvider()
  const token = new ethers.Contract(SPINGU_TOKEN_ADDRESS, SPINGU_TOKEN_ABI, provider)
  return await token.balanceOf(address)
}

export async function getSpinguAllowance(owner: string, spender: string): Promise<bigint> {
  const provider = await getProvider()
  const token = new ethers.Contract(SPINGU_TOKEN_ADDRESS, SPINGU_TOKEN_ABI, provider)
  return await token.allowance(owner, spender)
}

export async function approveSpingu(spender: string, amount: bigint, signer: ethers.Signer) {
  const token = new ethers.Contract(SPINGU_TOKEN_ADDRESS, SPINGU_TOKEN_ABI, signer)
  const tx = await token.approve(spender, amount)
  return await tx.wait()
}

export async function transferSpingu(to: string, amount: bigint, signer: ethers.Signer) {
  const token = new ethers.Contract(SPINGU_TOKEN_ADDRESS, SPINGU_TOKEN_ABI, signer)
  const tx = await token.transfer(to, amount)
  return await tx.wait()
}

// Cek apakah user berada di network SatuChain
export async function isOnSatuChain(): Promise<boolean> {
  const provider = await getProvider()
  const network = await provider.getNetwork()
  return network.chainId === SATUCHAIN_CHAIN_ID
}

// ============================================================
// SPINGU CHESS ESCROW CONTRACT (Smart Contract)
// ============================================================

// GANTI dengan alamat hasil deploy contract
export const SPINGU_CHESS_ESCROW = import.meta.env.VITE_SPINGU_CHESS_ESCROW || 
  '0x0000000000000000000000000000000000000000'

export const ESCROW_ABI = [
  'function createGame(bytes32 gameId, address player1, address player2, uint256 betAmount, uint8 gameType) external',
  'function deposit(bytes32 gameId) external',
  'function fundAIMatch(bytes32 gameId) external',
  'function resolveGame(bytes32 gameId, address winner) external',
  'function cancelGame(bytes32 gameId) external',
  'function getGame(bytes32 gameId) view returns (tuple(address player1, address player2, uint256 betAmount, uint256 totalPot, uint8 gameType, uint8 status, address winner, uint256 resolvedAt))',
  'function games(bytes32) view returns (address player1, address player2, uint256 betAmount, uint256 totalPot, uint8 gameType, uint8 status, address winner, uint256 resolvedAt)',
  'event GameCreated(bytes32 indexed gameId, address indexed player1, address indexed player2, uint256 betAmount, uint8 gameType)',
  'event DepositMade(bytes32 indexed gameId, address indexed player, uint256 amount)',
  'event GameResolved(bytes32 indexed gameId, address winner, uint256 winnerPayout, uint256 platformFee)',
] as const

export async function getEscrowContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const provider = signerOrProvider || await getProvider()
  return new ethers.Contract(SPINGU_CHESS_ESCROW, ESCROW_ABI, provider)
}

/**
 * Backend only - Create game on-chain
 */
export async function createGameOnChain(
  gameId: string,           // hex string 0x...
  player1: string,
  player2: string,          // treasury address for AI
  betAmount: bigint,
  isVsAI: boolean,
  signer: ethers.Signer
) {
  const escrow = new ethers.Contract(SPINGU_CHESS_ESCROW, ESCROW_ABI, signer)
  const gameType = isVsAI ? 0 : 1 // 0 = VS_AI, 1 = MULTIPLAYER
  const tx = await escrow.createGame(gameId, player1, player2, betAmount, gameType)
  return await tx.wait()
}

/**
 * Player deposits their bet (must approve escrow first)
 */
export async function depositToEscrow(gameId: string, signer: ethers.Signer) {
  const escrow = new ethers.Contract(SPINGU_CHESS_ESCROW, ESCROW_ABI, signer)
  const tx = await escrow.deposit(gameId)
  return await tx.wait()
}

/**
 * Backend calls this to fund the AI side (from treasury)
 */
export async function fundAIMatchOnChain(gameId: string, signer: ethers.Signer) {
  const escrow = new ethers.Contract(SPINGU_CHESS_ESCROW, ESCROW_ABI, signer)
  const tx = await escrow.fundAIMatch(gameId)
  return await tx.wait()
}

/**
 * Backend only - resolve the game and trigger payout + fee
 */
export async function resolveGameOnChain(gameId: string, winnerAddress: string, signer: ethers.Signer) {
  const escrow = new ethers.Contract(SPINGU_CHESS_ESCROW, ESCROW_ABI, signer)
  const tx = await escrow.resolveGame(gameId, winnerAddress)
  return await tx.wait()
}

