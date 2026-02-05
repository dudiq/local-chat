/**
 * End-to-end encryption using Web Crypto API
 * Uses AES-GCM with a key derived from password via PBKDF2
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const ITERATIONS = 600000 // OWASP 2023 minimum for PBKDF2-SHA256
const FORMAT_VERSION = 'v2'
const FORMAT_PREFIX = `${FORMAT_VERSION}:`
const SALT_LENGTH = 16
const IV_LENGTH = 12

class CryptoError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'CryptoError'
  }
}

function encodeBase64(data: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove "data:application/octet-stream;base64," prefix
      const result = reader.result as string;
      const res = result.split(',')[1] as string;
      resolve(res);
    };
    reader.onerror = reject;
    const buffer = data.buffer instanceof ArrayBuffer
      ? data.buffer
      : data.slice().buffer;

    reader.readAsDataURL(new Blob([buffer]));
  });
}

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function toAadBytes(aad: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(aad)
}

/**
 * Build AAD with length-prefixed encoding to prevent delimiter injection
 */
export function buildMessageAad({
                                  room,
                                  user,
                                  type,
                                  part,
                                }: {
  room: string
  user: string
  type: string
  part: 'text' | 'file-name' | 'file-data'
}): string {
  const fields = [
    `room:${room}`,
    `user:${user}`,
    `type:${type}`,
    `part:${part}`,
  ]

  // Length-prefix each field: "5:hello|4:test"
  return fields.map(f => `${f.length}:${f}`).join('|')
}

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
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(
  text: string,
  password: string,
  aad: string
): Promise<string> {
  if (!aad) {
    throw new CryptoError('AAD is required', 'MISSING_AAD')
  }

  try {
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const key = await deriveKey(password, salt)

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv.buffer as ArrayBuffer,
        additionalData: toAadBytes(aad).buffer as ArrayBuffer
      },
      key,
      encoder.encode(text)
    )

    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

    return `${FORMAT_PREFIX}${await encodeBase64(combined)}`
  } catch (error) {
    if (error instanceof CryptoError) throw error
    throw new CryptoError('Encryption failed', 'ENCRYPT_FAILED')
  }
}

export async function decrypt(
  encryptedBase64: string,
  password: string,
  aad: string
): Promise<string> {
  if (!aad) {
    throw new CryptoError('AAD is required', 'MISSING_AAD')
  }

  if (!encryptedBase64.startsWith(FORMAT_PREFIX)) {
    throw new CryptoError(
      `Unsupported format. Expected ${FORMAT_VERSION}`,
      'UNSUPPORTED_FORMAT'
    )
  }

  try {
    const decoder = new TextDecoder()
    const payload = encryptedBase64.slice(FORMAT_PREFIX.length)
    const combined = decodeBase64(payload)

    if (combined.length < SALT_LENGTH + IV_LENGTH) {
      throw new CryptoError('Invalid ciphertext: too short', 'INVALID_CIPHERTEXT')
    }

    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)

    const key = await deriveKey(password, salt)

    const plaintext = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv.buffer as ArrayBuffer,
        additionalData: toAadBytes(aad).buffer as ArrayBuffer,
      },
      key,
      ciphertext
    )

    return decoder.decode(plaintext)
  } catch (error) {
    if (error instanceof CryptoError) throw error

    throw new CryptoError(
      'Decryption failed: wrong password, corrupted data, or context mismatch',
      'DECRYPT_FAILED'
    )
  }
}
