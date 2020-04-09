#!/usr/bin/env node

'use strict'

const minimist = require('minimist')
const argv = minimist(process.argv.slice(2))
const { createDB } = require('./lib')

async function main () {
  const db = await createDB('postgres')
  const command = argv._.shift()

  switch (command) {
    case 'users:create':
      try {
        const { user, pass } = argv

        await db.createUser(user, pass)
        console.log(`User ${user} created!`)
      } catch (err) {
        throw new Error('Cannot create user')
      }
      break
    case 'users:list':
      try {
        const results = await db.listUsers()

        results.users.forEach(user => {
          console.log(`- ${user.user}`)
        })
        console.log(`Total: ${results.count}`)
      } catch (err) {
        throw new Error('Cannot list users')
      }
      break
    case 'secrets:create':
      try {
        const { user, name, value } = argv
        await db.createSecret(user, name, value)

        console.log(`Secret ${name} created`)
      } catch (err) {
        throw new Error('Cannot create secret')
      }
      break
    case 'secrets:list':
      try {
        const { user } = argv
        const secrets = await db.listSecrets(user)

        secrets.forEach(secret => {
          console.log(`- ${secret.name}`)
        })
      } catch (err) {
        throw new Error('Cannot list secrets')
      }
      break
    case 'secrets:get':
      try {
        const { user, name } = argv
        const secret = await db.getSecret(user, name)

        if (!secret) return console.log(`Secret ${name} not found`)
        console.log(`- ${secret.name} = ${secret.value}`)
      } catch (err) {
        throw new Error('Cannot get secret')
      }
      break
    case 'secrets:update':
      try {
        const { user, name, value } = argv
        await db.updateSecret(user, name, value)

        console.log(`Secret ${name} updated`)
      } catch (err) {
        throw new Error('Cannot update secret')
      }
      break
    case 'secrets:delete':
      try {
        const { user, name } = argv
        await db.deleteSecret(user, name)

        console.log(`Secret ${name} deleted`)
      } catch (err) {
        throw new Error('Cannot delete secret')
      }
      break
    default:
      console.error(`Command not found ${command}`)
  }
}

main().catch(err => console.log(err))
