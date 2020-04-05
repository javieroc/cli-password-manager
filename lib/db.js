'use strict'

const path = require('path')
const bcrypt = require('bcrypt')
const { Database } = require('sqlite3').verbose()

const saltRounds = 10
const client = new Database(path.join(__dirname, '..', 'secrets.db'))
const queries = {
  tableUsers: `
    CREATE TABLE IF NOT EXISTS users (
      user TEXT PRIMARY KEY,
      pass TEXT NOT NULL
    );
  `,
  tableSecrets: `
    CREATE TABLE IF NOT EXISTS secrets (
      user TEXT,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (user, name),
      FOREIGN KEY (user)
        REFERENCES users (user)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
    );
  `
}

async function createDB () {
  return new Promise((resolve, reject) => {
    client.serialize(() => {
      client.run(queries.tableUsers)
      client.run(queries.tableSecrets, err => {
        if (err) return reject(err)

        resolve({
          client,
          createUser,
          listUsers,
          createSecret,
          listSecrets,
          getSecret,
          updateSecret,
          deleteSecret
        })
      })
    })
  })
}

async function createUser (user, pass) {
  const passEncrypted = await bcrypt.hash(pass, saltRounds)
  return new Promise((resolve, reject) => {
    const statement = client.prepare('INSERT INTO users VALUES (?, ?)')
    statement.run(user, passEncrypted)
    statement.finalize(err => {
      if (err) return reject(err)

      resolve()
    })
  })
}

async function listUsers () {
  return new Promise((resolve, reject) => {
    const users = []
    client.each('SELECT user FROM users', (err, row) => {
      if (err) return reject(err)

      users.push(row)
    }, (err, count) => {
      if (err) return reject(err)

      resolve({ users, count })
    })
  })
}

async function createSecret (user, name, value) {
  return new Promise((resolve, reject) => {
    const statement = client.prepare('INSERT INTO secrets VALUES (?, ?, ?)')
    statement.run(user, name, value, err => {
      if (err) return reject(err)

      resolve()
    })
  })
}

async function listSecrets (user) {
  return new Promise((resolve, reject) => {
    const statement = client.prepare('SELECT name FROM secrets WHERE user = ?')
    statement.all(user, (err, rows) => {
      if (err) return reject(err)

      resolve(rows)
    })
  })
}

async function getSecret (user, name) {
  return new Promise((resolve, reject) => {
    const statement = client.prepare(`
      SELECT name, value FROM secrets
      WHERE user = ?
      AND name = ?
    `)
    statement.get(user, name, (err, row) => {
      if (err) return reject(err)

      resolve(row)
    })
  })
}

async function updateSecret (user, name, value) {
  return new Promise((resolve, reject) => {
    const statement = client.prepare(`
      UPDATE secrets SET value = ?
      WHERE user = ?
      AND name = ?
    `)
    statement.run(value, user, name, err => {
      if (err) return reject(err)

      resolve()
    })
  })
}

async function deleteSecret (user, name) {
  return new Promise((resolve, reject) => {
    const statement = client.prepare(`
      DELETE FROM secrets
      WHERE user = ?
      AND name = ?
    `)
    statement.run(user, name, err => {
      if (err) return reject(err)

      resolve()
    })
  })
}

module.exports = {
  createDB
}
