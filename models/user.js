'use strict'

const db = require('../components/db')
const crypto = require('crypto')


async function generateRandomHash(length){
  try{
    return await crypto.randomBytes(length).toString('base64')
  }catch(err){
    throw err;
  }
}

function createPasswordHash(password){
  return new Promise((resolve, reject) => {
    const salt = generateRandomHash(64)
    crypto.pbkdf2(password, salt, 104236, 64,'sha512', (err,key) => {
      if(err) reject(err);
      else resolve ({ password : key.toString('base64'), salt})
    })
  })
}

module.exports.createUser = async( option, connection ) => {
  try{
    const refreshHash = generateRandomHash(64)
    const passwordHash = await createPasswordHash(option.password)
    const { insertId } = await db.query({
      connection : connection,
      sql : `INSERT INTO ?? SET ?`,
      values : {email : option.email, password :passwordHash.password, salt : passwordHash.salt, refresh : refreshHash }
    })
    option.user_id = insertId
    delete option.password
    return { user : option, refreshHash }
  }catch(err){
    throw(err)
  }
}