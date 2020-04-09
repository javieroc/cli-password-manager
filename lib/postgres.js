'use strict'

const { Client } = require('pg')
const { hashPassword } = require('./crypto')

const dbUrl = 'postgresql://admin:admin@localhost:5432/secretsdb'
const client = new Client({
  connectionString: dbUrl
})

const queries = {
  tableUsers: `
    CREATE TABLE IF NOT EXISTS users (
      username text PRIMARY KEY,
      password text NOT NULL
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
    deleteSecret
  }
}

async function createUser (username, password) {
  const securePassword = await hashPassword(password)
  await client.query(
    'INSERT INTO users VALUES ($1, $2)',
    [username, securePassword]
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

async function createSecret (user, name, value) {
  await client.query(
    'INSERT INTO secrets VALUES ($1, $2, $3)',
    [user, name, value]
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

async function getSecret (user, name) {
  const results = await client.query(
    'SELECT name, value FROM secrets WHERE username = $1 AND name = $2',
    [user, name]
  )
  await client.end()
  const result = results.rows.length ? results.rows[0] : null
  return result
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
