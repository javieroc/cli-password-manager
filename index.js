#!/usr/bin/env node

'use strict'

require('dotenv').config()

const minimist = require('minimist')
const promptly = require('promptly')
const argv = minimist(process.argv.slice(2))
const { createDB } = require('./lib')

const prompPassword = () => promptly.password('Enter your password: ', { replace: '*' })

async function main () {
  const db = await createDB(process.env.DB_TYPE)
  const command = argv._.shift()

  switch (command) {
    case 'users:create':
      try {
        const { user } = argv
        const pass = await prompPassword()

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
        const pass = await prompPassword()
        const isAuth = await db.authenticate(user, pass)
        if (!isAuth) throw new Error('Invalid user or password')

        await db.createSecret(user, pass, name, value)

        console.log(`Secret ${name} created`)
      } catch (err) {
        console.log(err)
        throw new Error('Cannot create secret')
      }
      break
    case 'secrets:list':
      try {
        const { user } = argv
        const pass = await prompPassword()
        const isAuth = await db.authenticate(user, pass)
        if (!isAuth) throw new Error('Invalid user or password')
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
        const pass = await prompPassword()
        const isAuth = await db.authenticate(user, pass)
        if (!isAuth) throw new Error('Invalid user or password')
        const secret = await db.getSecret(user, pass, name)

        if (!secret) return console.log(`Secret ${name} not found`)
        console.log(`- ${secret.name} = ${secret.value}`)
      } catch (err) {
        throw new Error('Cannot get secret')
      }
      break
    case 'secrets:update':
      try {
        const { user, name, value } = argv
        const pass = await prompPassword()
        const isAuth = await db.authenticate(user, pass)
        if (!isAuth) throw new Error('Invalid user or password')
        await db.updateSecret(user, name, value)

        console.log(`Secret ${name} updated`)
      } catch (err) {
        throw new Error('Cannot update secret')
      }
      break
    case 'secrets:delete':
      try {
        const { user, name } = argv
        const pass = await prompPassword()
        const isAuth = await db.authenticate(user, pass)
        if (!isAuth) throw new Error('Invalid user or password')
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
