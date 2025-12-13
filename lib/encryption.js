import CryptoJS from 'crypto-js'

// Fernet-style encryption using AES
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'jqm1A+b4h1iQdVyKXtB3/Of2Uu4KGz670GOs1oBFWVQ='

export function encryptTFN(tfn) {
  if (!tfn) return null
  // Remove spaces and format
  const cleanTFN = tfn.replace(/\s+/g, '')
  // Encrypt using AES
  const encrypted = CryptoJS.AES.encrypt(cleanTFN, ENCRYPTION_KEY).toString()
  return encrypted
}

export function decryptTFN(encryptedTFN) {
  if (!encryptedTFN) return null
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedTFN, ENCRYPTION_KEY)
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('TFN decryption error:', error)
    return null
  }
}

export function maskTFN(tfn) {
  if (!tfn) return ''
  const cleanTFN = tfn.replace(/\s+/g, '')
  if (cleanTFN.length !== 9) return '••• ••• •••'
  const last3 = cleanTFN.slice(-3)
  return `••• ••• ${last3}`
}

export function formatTFN(tfn) {
  if (!tfn) return ''
  const cleanTFN = tfn.replace(/\s+/g, '')
  if (cleanTFN.length !== 9) return tfn
  return `${cleanTFN.slice(0, 3)} ${cleanTFN.slice(3, 6)} ${cleanTFN.slice(6, 9)}`
}

export function formatABN(abn) {
  if (!abn) return ''
  const cleanABN = abn.replace(/\s+/g, '')
  if (cleanABN.length !== 11) return abn
  return `${cleanABN.slice(0, 2)} ${cleanABN.slice(2, 5)} ${cleanABN.slice(5, 8)} ${cleanABN.slice(8, 11)}`
}

export function formatBSB(bsb) {
  if (!bsb) return ''
  const cleanBSB = bsb.replace(/[^0-9]/g, '')
  if (cleanBSB.length !== 6) return bsb
  return `${cleanBSB.slice(0, 3)}-${cleanBSB.slice(3, 6)}`
}
