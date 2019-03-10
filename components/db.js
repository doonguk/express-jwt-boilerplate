'use strict'

const config = require('../config')
const mysql = require('mysql')
const Schemas = require('../schemas/index')
const pool = mysql.createPool({...config.database})

module.exports.query = (options) => {
  return new Promise((resolve, reject) => {
    try {
      let target = options.connection ? options.connection : pool
      let sql = mysql.format(options.sql, options.values)
      console.log(sql + '\n')
      target.query(sql,
          (error, results, fields) => {
            if (error) {
              reject(error)
            } else {
              if (options.schema) {
                results.forEach(row => {
                  Schemas.convert(row, options.schema, {useDefaults: true, removeAdditional: true})
                })
              }
              resolve(results)
            }
          })
      console.log('test')
    } catch (e) {
      reject(e)
    }
  })
}


module.exports.rollback = (connection) => {
  return new Promise((resolve, reject )=> {
    try {
      connection.rollback((err) => {
        if (err) reject(err)
        else {
          connection.release()
          resolve()
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}

module.exports.getConnection = () => {
  return new Promise ( (resolve, reject ) => {
    try{
      pool.getConnection(( err, connection ) => {
        if(err){
          reject(err)
        }
        else resolve(connection)
      })
    }catch(err){
      reject(err)
    }
  })
}

module.exports.beginTransaction = () => {
  return new Promise( (resolve, reject ) => {
    try{
      this.getConnection().then( (connection) =>{
        connection.beginTransaction((err ) => {
          if(err){
            reject(this.rollback(connection))
          }
          else {
            resolve(connection)}
        })
      }).catch((err)=>{
        reject(err)
      })
    }catch(err){
      reject(err)
    }
  })
}

module.exports.commit = (connection) => {
  return new Promise(( resolve, reject ) => {
    try{
      connection.commit((err) => {
        if(err){reject(err)}
        else{
          connection.release()
          resolve()
        }
      })
    }catch(err){
      reject(err)
    }
  })
}