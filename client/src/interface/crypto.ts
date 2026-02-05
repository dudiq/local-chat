/**
 * End-to-end encryption using Web Crypto API
 * Uses AES-GCM with a key derived from password via PBKDF2
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const ITERATIONS = 100000

// Derive encryption key from password
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypt text, returns base64 string (salt:iv:ciphertext)
export async function encrypt(text: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(text)
  )

  // Combine salt + iv + ciphertext and encode as base64
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

  return btoa(String.fromCharCode(...combined))
}

// Decrypt base64 string, returns original text
export async function decrypt(encryptedBase64: string, password: string): Promise<string> {
  const decoder = new TextDecoder()
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))

  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const ciphertext = combined.slice(28)

  const key = await deriveKey(password, salt)

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  )

  return decoder.decode(plaintext)
}
