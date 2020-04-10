'use strict'

const { Client } = require('pg')
const {
  hashPassword,
  comparePassword,
  generateRandomKey,
  generateKey,
  encrypt,
  decrypt
} = require('./crypto')

const dbUrl = process.env.DB_URL
const client = new Client({
  connectionString: dbUrl
})

const queries = {
  tableUsers: `
    CREATE TABLE IF NOT EXISTS users (
      username text PRIMARY KEY,
      password text NOT NULL,
      randomkey text NOT NULL
    );
  `,
  tableSecrets: `
    CREATE TABLE IF NOT EXISTS secrets (
      username text REFERENCES users (username),
      name text NOT NULL,
      value text NOT NULL,
      PRIMARY KEY (username, name)
    );
  `
}

async function createDB () {
  await client.connect()

  await client.query(queries.tableUsers)
  await client.query(queries.tableSecrets)

  return {
    client,
    createUser,
    listUsers,
    createSecret,
    listSecrets,
    getSecret,
    updateSecret,
    deleteSecret,
    authenticate
  }
}

async function authenticate (username, password) {
  const user = await getAuthenticatedUser(username, password)
  return user != null
}

async function getAuthenticatedUser (username, password) {
  const results = await client.query(
    'SELECT username, password, randomkey FROM users WHERE username = $1',
    [username]
  )

  const user = results.rows && results.rows.length ? results.rows[0] : null

  if (!user) {
    return null
  }

  const { password: hash, ...rest } = user

  const isPasswordOk = await comparePassword(password, hash)
  if (isPasswordOk) {
    return { ...rest }
  }
  return null
}

async function createUser (username, password) {
  const securePassword = await hashPassword(password)
  await client.query(
    'INSERT INTO users VALUES ($1, $2, $3)',
    [username, securePassword, generateRandomKey()]
  )
  await client.end()
}

async function listUsers () {
  const results = await client.query('SELECT username AS user FROM users')
  await client.end()
  return {
    count: results.rowCount,
    users: results.rows
  }
}

async function createSecret (username, password, name, value) {
  const user = await getAuthenticatedUser(username, password)
  const { randomkey } = user
  const secretKey = generateKey(password)
  const encrypted = encrypt(value, secretKey, randomkey)

  await client.query(
    'INSERT INTO secrets VALUES ($1, $2, $3)',
    [username, name, encrypted]
  )
  await client.end()
}

async function listSecrets (user) {
  const results = await client.query(
    'SELECT name FROM secrets WHERE username = $1',
    [user]
  )
  await client.end()
  return results.rows
}

async function getSecret (username, password, name) {
  const results = await client.query(
    'SELECT name, value FROM secrets WHERE username = $1 AND name = $2',
    [username, name]
  )

  if (!results.rows.length > 0) return

  const secret = results.rows[0]
  const user = await getAuthenticatedUser(username, password)
  const { randomkey } = user
  const secretKey = generateKey(password)
  const decrypted = decrypt(secret.value, secretKey, randomkey)

  await client.end()
  return {
    name: secret.name,
    value: decrypted
  }
}

async function updateSecret (user, name, value) {
  await client.query(
    'UPDATE secrets SET value = $3 WHERE username = $1 AND name = $2',
    [user, name, value]
  )
  await client.end()
}

async function deleteSecret (user, name) {
  await client.query(
    'DELETE FROM secrets WHERE username = $1 AND name = $2',
    [user, name]
  )
  await client.end()
}

module.exports = {
  createDB
}
