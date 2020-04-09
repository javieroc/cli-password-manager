'use strict'

const path = require('path')

function createDB (type) {
  const db = require(path.join(__dirname, `${type}.js`))
  return db.createDB()
}

module.exports = {
  createDB
}
