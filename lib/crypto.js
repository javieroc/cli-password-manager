'use strict'

const crypto = require('crypto')
const bcrypt = require('bcrypt')
const saltRounds = 10
const algorithm = 'aes-256-cbc'

function hashPassword (password) {
  return bcrypt.hash(password, saltRounds)
}

function comparePassword (password, hash) {
  return bcrypt.compare(password, hash)
}

function encrypt (data, key, iv) {
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  )

  let encrypted = cipher.update(data)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return encrypted.toString('hex')
}

function decrypt (data, key, iv) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  )

  let decrypted = decipher.update(Buffer.from(data, 'hex'))
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

function generateRandomKey () {
  return crypto.randomBytes(16).toString('hex')
}

function generateKey (password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

module.exports = {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt,
  generateRandomKey,
  generateKey
}
