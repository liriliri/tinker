/**
 * Password-based encryption utilities using Web Crypto API (PBKDF2 + AES-GCM).
 * No external dependencies required.
 */
import base64 from 'licia/base64'
import liciaRandomBytes from 'licia/randomBytes'

const PBKDF2_ITERATIONS = 200_000
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 256
const PASSWORD_SENTINEL = 'tinker-authenticator-sentinel'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function encode(str: string): Uint8Array<ArrayBuffer> {
  return encoder.encode(str) as Uint8Array<ArrayBuffer>
}

function decode(buf: ArrayBuffer): string {
  return decoder.decode(buf)
}

function toBase64(buf: ArrayBuffer): string {
  return base64.encode(Array.from(new Uint8Array(buf)))
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(base64.decode(b64)) as Uint8Array<ArrayBuffer>
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return liciaRandomBytes(length) as Uint8Array<ArrayBuffer>
}

function packBlob(
  salt: Uint8Array<ArrayBuffer>,
  iv: Uint8Array<ArrayBuffer>,
  cipher: ArrayBuffer
): string {
  const packed = new Uint8Array(SALT_LENGTH + IV_LENGTH + cipher.byteLength)
  packed.set(salt, 0)
  packed.set(iv, SALT_LENGTH)
  packed.set(new Uint8Array(cipher), SALT_LENGTH + IV_LENGTH)
  return toBase64(packed.buffer as ArrayBuffer)
}

function unpackBlob(b64: string): {
  salt: Uint8Array<ArrayBuffer>
  iv: Uint8Array<ArrayBuffer>
  cipher: Uint8Array<ArrayBuffer>
} {
  const packed = fromBase64(b64)
  return {
    salt: packed.slice(0, SALT_LENGTH),
    iv: packed.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH),
    cipher: packed.slice(SALT_LENGTH + IV_LENGTH),
  }
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Hash a password for storage/verification.
 * Returns a base64-encoded string: salt(16) + iv(12) + ciphertext of a known plaintext.
 * Verification decrypts and checks the plaintext.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const key = await deriveKey(password, salt)
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encode(PASSWORD_SENTINEL)
  )
  return packBlob(salt, iv, cipher)
}

/** Verify a password against a stored hash created by hashPassword */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const { salt, iv, cipher } = unpackBlob(hash)
    const key = await deriveKey(password, salt)
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    )
    return decode(plain) === PASSWORD_SENTINEL
  } catch {
    return false
  }
}

/**
 * Encrypt a plaintext string with a password.
 * Returns a base64-encoded string: salt(16) + iv(12) + ciphertext.
 */
export async function encryptText(
  text: string,
  password: string
): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const key = await deriveKey(password, salt)
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encode(text)
  )
  return packBlob(salt, iv, cipher)
}

/**
 * Decrypt a ciphertext string (produced by encryptText) with a password.
 * Returns the original plaintext, or null on failure.
 */
export async function decryptText(
  ciphertext: string,
  password: string
): Promise<string | null> {
  try {
    const { salt, iv, cipher } = unpackBlob(ciphertext)
    const key = await deriveKey(password, salt)
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    )
    return decode(plain)
  } catch {
    return null
  }
}
