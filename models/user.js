'use strict'

const db = require('../components/db')
const crypto = require('crypto')

module.exports.tableName ='Users'

function generateRandomHash(length) {
  return crypto.randomBytes(length).toString('base64').replace(/[^A-Za-z0-9]/g, '')
}

function createPasswordHash(password){
  return new Promise( (resolve, reject ) => {
    try {
      const salt =  generateRandomHash(64)
      crypto.pbkdf2(password, salt, 104236, 64, 'sha512', (err, key) => {
        resolve({password: key.toString('base64'), salt})
      })
    }catch(err){
      reject(err)
    }
  })
}

module.exports.createUser = async( option, connection ) => {
  try{
    const refreshHash = generateRandomHash(64)
    const passwordHash = await createPasswordHash(option.password)
    const { insertId } = await db.query({
      connection : connection,
      sql : `INSERT INTO ?? SET ?`,
      values : [this.tableName,{email : option.email, password :passwordHash.password, salt : passwordHash.salt, refresh : refreshHash}]
    })
    option.user_id = insertId
    delete option.password
    return { user : option, refreshHash }
  }catch(err){
    throw(err)
  }
}


module.exports.findOne = async (option) => {
  try{
    const result = await db.query({
      sql : `SELECT * FROM ?? WHERE ? LIMIT 1`,
      values : [this.tableName, option]
    })
    return result[0]
  }catch(err){
    throw err
  }
}