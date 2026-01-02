import CryptoJS from 'crypto-js'

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512'

export const HASH_ALGORITHMS: HashAlgorithm[] = [
  'md5',
  'sha1',
  'sha256',
  'sha512',
]

export function calculateHash(algorithm: HashAlgorithm, input: string): string {
  if (!input) return ''

  try {
    const hashFunctions = {
      md5: CryptoJS.MD5,
      sha1: CryptoJS.SHA1,
      sha256: CryptoJS.SHA256,
      sha512: CryptoJS.SHA512,
    }

    const hashFn = hashFunctions[algorithm]
    const result = hashFn(input)
    return result.toString()
  } catch (error) {
    console.error(`Failed to calculate ${algorithm} hash:`, error)
    return ''
  }
}

export function calculateAllHashes(
  input: string
): Record<HashAlgorithm, string> {
  return {
    md5: calculateHash('md5', input),
    sha1: calculateHash('sha1', input),
    sha256: calculateHash('sha256', input),
    sha512: calculateHash('sha512', input),
  }
}

export async function calculateFileHashes(
  file: File
): Promise<Record<HashAlgorithm, string>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)

        const results = {
          md5: CryptoJS.MD5(wordArray).toString(),
          sha1: CryptoJS.SHA1(wordArray).toString(),
          sha256: CryptoJS.SHA256(wordArray).toString(),
          sha512: CryptoJS.SHA512(wordArray).toString(),
        }

        resolve(results)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}
