import { PasskeyArgType } from '@safe-global/protocol-kit'
import { Safe4337Pack, SponsoredPaymasterOption } from '@safe-global/relay-kit'
import { encodeFunctionData } from 'viem'
import {
  BUNDLER_URL,
  NFT_ADDRESS,
  PAYMASTER_ADDRESS,
  PAYMASTER_URL,
  RPC_URL
} from './constants'

const paymasterOptions = {
  isSponsored: true,
  paymasterAddress: PAYMASTER_ADDRESS,
  paymasterUrl: PAYMASTER_URL
} as SponsoredPaymasterOption

// パスキーを使用して署名を行いNFT Mintをするメソッド
export const mintNFT = async (
  passkey: PasskeyArgType,
  safeAddress: string
): Promise<string> => {
  // 1) Initialize Safe4337Pack
  const safe4337Pack = await Safe4337Pack.init({
    provider: RPC_URL,
    signer: passkey,
    bundlerUrl: BUNDLER_URL,
    paymasterOptions,
    options: {
      owners: [
        /* Other owners... */
      ],
      threshold: 1
    }
  })

  // 2) Create SafeOperation
  const mintNFTTransaction = {
    to: NFT_ADDRESS,
    data: encodeSafeMintData(safeAddress),
    value: '0'
  }

  const safeOperation = await safe4337Pack.createTransaction({
    transactions: [mintNFTTransaction]
  })

  // 3) Sign SafeOperation
  const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)

  console.log('Signed SafeOperation', signedSafeOperation)

  // 4) Execute SafeOperation
  const userOperationHash = await safe4337Pack.executeTransaction({
    executable: signedSafeOperation
  })

  return userOperationHash
}

// safe mintのためのエンコードデータ
// トランザクションのdataにはスマートコントラクトのABIを元にエンコードしたデータが入る
export function encodeSafeMintData(
  to: string,
  tokenId: bigint = getRandomUint256()
): string {
  return encodeFunctionData({
    abi: [
      {
        constant: false,
        inputs: [
          {
            name: 'to',
            type: 'address'
          },
          {
            name: 'tokenId',
            type: 'uint256'
          }
        ],
        name: 'safeMint',
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    functionName: 'safeMint',
    args: [to, tokenId]
  })
}

function getRandomUint256(): bigint {
  const dest = new Uint8Array(32) // Create a typed array capable of storing 32 bytes or 256 bits

  crypto.getRandomValues(dest) // Fill the typed array with cryptographically secure random values

  let result = 0n
  for (let i = 0; i < dest.length; i++) {
    result |= BigInt(dest[i]) << BigInt(8 * i) // Combine individual bytes into one bigint
  }

  return result
}