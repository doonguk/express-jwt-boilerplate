'use strict'

const config = require('../config')
const mysql = require('mysql')

const pool = mysql.createPool(...config.database)

module.exports.query = (option) => {
  return new Promise( (resolve, reject) => {
    try{
      const target = option.connection ? option.connection : pool
      const sql = mysql.format(option.sql, option.value)
      target.query({sql : sql}, (err, result) => {
        if(err){
          reject(this.rollback(target))
        }
        else{
          resolve(result)
        }
      })
    }catch(err){
      reject(err)
    }
  })
}


module.exports.rollback = (connection) => {
  return new Promise((resolve, reject) => {
    try{
      connection.rollback((err) => {
        if(err) reject(err)
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

module.exports.getConnection = () => {
  return new Promise ( (resolve, reject ) => {
    try{
      pool.getConnection(( err, connection ) => {
        if(err){ reject(this.rollback(connection))}
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
        connection.beginTransaction((err,connection ) => {
          if(err){ reject(this.rollback(connection))}
          else { resolve(connection)}
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