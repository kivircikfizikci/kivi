const URL_SAFE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const MAX_UNBIASED_BYTE = Math.floor(256 / URL_SAFE_ALPHABET.length) * URL_SAFE_ALPHABET.length

export type RandomValuesSource = (buffer: Uint8Array) => Uint8Array

const browserRandomValues: RandomValuesSource = (buffer) => globalThis.crypto.getRandomValues(buffer)

export function generateUrlSafeId(length: number, randomValues: RandomValuesSource = browserRandomValues) {
  if (!Number.isInteger(length) || length < 1) throw new Error('ID length must be a positive integer')
  let result = ''
  while (result.length < length) {
    const bytes = randomValues(new Uint8Array(Math.max(8, length - result.length)))
    for (const byte of bytes) {
      if (byte >= MAX_UNBIASED_BYTE) continue
      result += URL_SAFE_ALPHABET[byte % URL_SAFE_ALPHABET.length]
      if (result.length === length) break
    }
  }
  return result
}

export function generateProjectId(randomValues?: RandomValuesSource) {
  return generateUrlSafeId(8, randomValues)
}

export function generateShareId(randomValues?: RandomValuesSource) {
  return generateUrlSafeId(16, randomValues)
}
