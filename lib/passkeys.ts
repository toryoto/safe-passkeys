import { PasskeyArgType, extractPasskeyData } from '@safe-global/protocol-kit'
import { STORAGE_PASSKEY_LIST_KEY } from './constants'

// WebAuthn　APIでパスキーを作成する
// 一般的には秘密鍵はユーザのデバイス、公開鍵はサーバーに保存
export async function createPasskey(): Promise<PasskeyArgType> {
  // 今回はユーザ名は固定
  const displayName = 'Safe Owner'
  const passkeyCredential = await navigator.credentials.create({
    publicKey: {
      pubKeyCredParams: [
        {
          // 公開鍵作成にはECDSAを使用
          alg: -7,
          type: 'public-key'
        }
      ],
      // 認証時にサーバーがチャレンジとしてランダムな32桁を生成して送信
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: {
        name: 'Safe SmartAccount'
      },
      user: {
        displayName,
        id: crypto.getRandomValues(new Uint8Array(32)),
        name: displayName,
      },
      timeout: 60_000,
      attestation: 'none'
    }
  })

  if (!passkeyCredential) {
    throw Error('Passkey creation failed: No credential was returned.')
  }

  const passkey = await extractPasskeyData(passkeyCredential)
  console.log('Created Passkey:', passkey)

  return passkey
}

// パスキーをローカルストレージに保存
export function storePasskeyInLocalStorage(passkey: PasskeyArgType) {
  console.log("storePasskeyInLocalStorage is called")
  const passkeys = loadPasskeysFromLocalStorage()

  passkeys.push(passkey)

  localStorage.setItem(STORAGE_PASSKEY_LIST_KEY, JSON.stringify(passkeys))
}

// ローカルストレージからパスキーを取得
export function loadPasskeysFromLocalStorage(): PasskeyArgType[] {
  console.log("loadPasskeysFromLocalStorage is called")
  const passkeysStored = localStorage.getItem(STORAGE_PASSKEY_LIST_KEY)

  const passkeyIds = passkeysStored ? JSON.parse(passkeysStored) : []

  return passkeyIds
}

export function getPasskeyFromRawId(passkeyRawId: string): PasskeyArgType {
  console.log("getPasskeyFromRawId is called")
  const passkeys = loadPasskeysFromLocalStorage()

  const passkey = passkeys.find((passkey) => passkey.rawId === passkeyRawId)!

  return passkey
}