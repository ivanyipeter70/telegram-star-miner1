import { Address, beginCell, toNano } from '@ton/core'
import type { SendTransactionRequest } from '@tonconnect/ui-react'

// TON mainnet chain id used by TON Connect
export const TON_MAINNET_CHAIN = '-239'

// Conversion rate: 1000 Stars = 1 TON
export const STARS_TO_TON_RATE = 0.001

/**
 * Validate any TON wallet address (user-friendly EQ/UQ form or raw 0: form).
 */
export function isValidTonAddress(value: string): boolean {
  if (!value) return false
  try {
    Address.parse(value.trim())
    return true
  } catch {
    return false
  }
}

/**
 * Normalize an address into the canonical bounceable/non-bounceable string.
 * We send to the non-bounceable form so funds reach plain wallets reliably.
 */
export function normalizeAddress(value: string): string {
  return Address.parse(value.trim()).toString({ bounceable: false })
}

/**
 * Shorten an address for display: EQAbc...x1y2
 */
export function shortenAddress(value: string, head = 6, tail = 4): string {
  if (!value) return ''
  if (value.length <= head + tail + 3) return value
  return `${value.slice(0, head)}...${value.slice(-tail)}`
}

/**
 * Build a TON Connect transaction request that sends `tonAmount` TON directly
 * to any recipient address on mainnet, with an optional text comment.
 *
 * The connected wallet signs and broadcasts this immediately — the transfer is
 * direct and on-chain, settling within seconds.
 */
export function buildTonTransfer(
  toAddress: string,
  tonAmount: number,
  comment?: string,
): SendTransactionRequest {
  const destination = Address.parse(toAddress.trim()).toString({ bounceable: false })

  let payload: string | undefined
  if (comment && comment.trim()) {
    // Standard text comment: 32-bit zero opcode + UTF-8 string
    payload = beginCell()
      .storeUint(0, 32)
      .storeStringTail(comment.trim())
      .endCell()
      .toBoc()
      .toString('base64')
  }

  return {
    validUntil: Math.floor(Date.now() / 1000) + 300, // valid for 5 minutes
    network: TON_MAINNET_CHAIN,
    messages: [
      {
        address: destination,
        amount: toNano(tonAmount.toFixed(9)).toString(), // amount in nanoTON
        ...(payload ? { payload } : {}),
      },
    ],
  }
}

/**
 * Build the tonviewer.com explorer URL for a wallet address.
 */
export function explorerAddressUrl(address: string): string {
  return `https://tonviewer.com/${address}`
}
