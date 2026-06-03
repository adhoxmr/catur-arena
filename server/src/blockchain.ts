import { ethers } from 'ethers'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Force load .env from the current working directory explicitly
const envPath = path.resolve(process.cwd(), '.env')
console.log('Attempting to load env from:', envPath)
console.log('File exists:', fs.existsSync(envPath))

dotenv.config({ path: envPath })

// ============================================================
// CONFIG
// ============================================================
const SPINGU_TOKEN_ADDRESS = process.env.SPINGU_TOKEN_ADDRESS || '0xb6248d93cf91b00b79fae46d3d4a8b50ac04fd3b'
const ESCROW_ADDRESS = process.env.SPINGU_CHESS_ESCROW || ''
const RPC_URL = process.env.SATUCHAIN_RPC_URL || ''
const OPERATOR_PRIVATE_KEY = process.env.GAME_OPERATOR_PRIVATE_KEY || ''

console.log('--- Blockchain Env Debug ---')
console.log('Current working directory:', process.cwd())
console.log('SPINGU_CHESS_ESCROW present:', !!ESCROW_ADDRESS, ESCROW_ADDRESS ? '(' + ESCROW_ADDRESS.slice(0,6) + '...)' : '')
console.log('SATUCHAIN_RPC_URL present:', !!RPC_URL, RPC_URL ? '(' + RPC_URL + ')' : '')
console.log('GAME_OPERATOR_PRIVATE_KEY present:', !!OPERATOR_PRIVATE_KEY, OPERATOR_PRIVATE_KEY ? '(length: ' + OPERATOR_PRIVATE_KEY.length + ')' : '')
console.log('--- End Debug ---')

if (!ESCROW_ADDRESS || !RPC_URL || !OPERATOR_PRIVATE_KEY) {
  console.warn('⚠️  Blockchain config incomplete. Real token betting will be disabled.')
}

// ============================================================
// PROVIDER & SIGNER
// ============================================================
let provider: ethers.JsonRpcProvider
let operatorSigner: ethers.Wallet
let escrowContract: ethers.Contract

const ESCROW_ABI = [
  'function createGame(bytes32 gameId, address player1, address player2, uint256 betAmount, uint8 gameType) external',
  'function deposit(bytes32 gameId) external',
  'function fundAIMatch(bytes32 gameId) external',
  'function resolveGame(bytes32 gameId, address winner) external',
  'function cancelGame(bytes32 gameId) external',
  'function getGame(bytes32 gameId) view returns (tuple(address player1, address player2, uint256 betAmount, uint256 totalPot, uint8 gameType, uint8 status, address winner, uint256 resolvedAt))',
  'event GameResolved(bytes32 indexed gameId, address winner, uint256 winnerPayout, uint256 platformFee)',
]

export function initBlockchain() {
  if (!RPC_URL || !OPERATOR_PRIVATE_KEY || !ESCROW_ADDRESS) {
    console.log('Blockchain service disabled (missing env vars)')
    console.log('Missing:', {
      ESCROW_ADDRESS: !ESCROW_ADDRESS,
      RPC_URL: !RPC_URL,
      OPERATOR_PRIVATE_KEY: !OPERATOR_PRIVATE_KEY
    })
    return false
  }

  try {
    provider = new ethers.JsonRpcProvider(RPC_URL)
    operatorSigner = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider)
    escrowContract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, operatorSigner)

    console.log('✅ Blockchain service initialized')
    console.log('   Escrow Contract:', ESCROW_ADDRESS)
    console.log('   Operator Address:', operatorSigner.address)
    return true
  } catch (error) {
    console.error('❌ Failed to initialize blockchain service:', error)
    return false
  }
}

export function isBlockchainEnabled(): boolean {
  return !!escrowContract
}

// ============================================================
// GAME ID HELPER
// ============================================================
export function generateGameId(roomId: string): string {
  // Convert roomId string to bytes32
  return ethers.keccak256(ethers.toUtf8Bytes(roomId))
}

// ============================================================
// CREATE GAME ON CHAIN
// ============================================================
export async function createGameOnChain(params: {
  roomId: string
  player1: string
  player2: string          // Treasury address for AI, or second player address
  betAmount: bigint        // in wei (18 decimals)
  isVsAI: boolean
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!isBlockchainEnabled()) {
    return { success: false, error: 'Blockchain not configured' }
  }

  try {
    const gameId = generateGameId(params.roomId)
    const gameType = params.isVsAI ? 0 : 1 // 0 = VS_AI, 1 = MULTIPLAYER

    console.log(`[Blockchain] Creating game on-chain: ${params.roomId}`)
    console.log(`  Player1: ${params.player1}`)
    console.log(`  Player2: ${params.player2}`)
    console.log(`  Bet: ${ethers.formatUnits(params.betAmount, 18)} SPINGU`)
    console.log(`  Type: ${params.isVsAI ? 'VS AI' : 'Multiplayer'}`)

    const tx = await escrowContract.createGame(
      gameId,
      params.player1,
      params.player2,
      params.betAmount,
      gameType
    )

    const receipt = await tx.wait()

    console.log(`[Blockchain] Game created on-chain. Tx: ${receipt.hash}`)

    return {
      success: true,
      txHash: receipt.hash,
    }
  } catch (error: any) {
    console.error('[Blockchain] createGameOnChain failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to create game on chain',
    }
  }
}

// ============================================================
// RESOLVE GAME ON CHAIN
// ============================================================
export async function resolveGameOnChain(params: {
  roomId: string
  winnerAddress: string
}): Promise<{ success: boolean; txHash?: string; error?: string; payout?: bigint; fee?: bigint }> {
  if (!isBlockchainEnabled()) {
    return { success: false, error: 'Blockchain not configured' }
  }

  try {
    const gameId = generateGameId(params.roomId)

    console.log(`[Blockchain] Resolving game on-chain: ${params.roomId}`)
    console.log(`  Winner: ${params.winnerAddress}`)

    const tx = await escrowContract.resolveGame(gameId, params.winnerAddress)
    const receipt = await tx.wait()

    // Parse GameResolved event to get actual payout numbers
    const event = receipt.logs
      .map((log: any) => {
        try {
          return escrowContract.interface.parseLog(log)
        } catch {
          return null
        }
      })
      .find((e: any) => e && e.name === 'GameResolved')

    let payout = 0n
    let fee = 0n

    if (event) {
      payout = event.args[2] as bigint
      fee = event.args[3] as bigint
      console.log(`[Blockchain] Payout: ${ethers.formatUnits(payout, 18)} SPINGU | Fee: ${ethers.formatUnits(fee, 18)} SPINGU`)
    }

    console.log(`[Blockchain] Game resolved on-chain. Tx: ${receipt.hash}`)

    return {
      success: true,
      txHash: receipt.hash,
      payout,
      fee,
    }
  } catch (error: any) {
    console.error('[Blockchain] resolveGameOnChain failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to resolve game on chain',
    }
  }
}

// ============================================================
// OPTIONAL: Fund AI Match (if you want backend to trigger it)
// ============================================================
export async function fundAIMatchOnChain(roomId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!isBlockchainEnabled()) {
    return { success: false, error: 'Blockchain not configured' }
  }

  try {
    const gameId = generateGameId(roomId)
    const tx = await escrowContract.fundAIMatch(gameId)
    const receipt = await tx.wait()

    console.log(`[Blockchain] AI match funded. Tx: ${receipt.hash}`)
    return { success: true, txHash: receipt.hash }
  } catch (error: any) {
    console.error('[Blockchain] fundAIMatchOnChain failed:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================
// GET GAME FROM CHAIN (for verification)
// ============================================================
export async function getGameFromChain(roomId: string) {
  if (!isBlockchainEnabled()) return null

  try {
    const gameId = generateGameId(roomId)
    const game = await escrowContract.getGame(gameId)
    return {
      player1: game[0],
      player2: game[1],
      betAmount: game[2],
      totalPot: game[3],
      gameType: Number(game[4]),
      status: Number(game[5]),
      winner: game[6],
      resolvedAt: Number(game[7]),
    }
  } catch {
    return null
  }
}

// ============================================================
// CANCEL GAME ON CHAIN (refunds deposits)
// ============================================================
export async function cancelGameOnChain(roomId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!isBlockchainEnabled()) {
    return { success: false, error: 'Blockchain not configured' }
  }

  try {
    const gameId = generateGameId(roomId)
    const tx = await escrowContract.cancelGame(gameId)
    const receipt = await tx.wait()

    console.log(`[Blockchain] Game cancelled on-chain. Tx: ${receipt.hash}`)
    return { success: true, txHash: receipt.hash }
  } catch (error: any) {
    console.error('[Blockchain] cancelGameOnChain failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to cancel game on chain',
    }
  }
}
