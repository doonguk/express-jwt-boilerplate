'use strict'
const jwt = require('jsonwebtoken')
const fs = require('fs')
const privateKey = fs.readFileSync(`${__dirname}/private.pem`)
const publicKey = fs.readFileSync(`${__dirname}/public.pem`)
const User = require('../../models/user')

module.exports.createAccessToken = async (user) => {
  try{
    const payload = {
      sub : user.user_id
    }
    const jwtToken = await jwt.sign(payload, privateKey,{
      algorithm: 'RS256',
      expiresIn: 60 * 60
    })
    return jwtToken
  }catch(err){
    throw(err)
  }
}

module.exports.createRefreshToken = async (user, refreshHash) => {
  try{
    const payload = {
      sub : user.user_id
    }
    const jwtToken = jwt.sign(payload, refreshHash,{
      algorithm: 'HS256',
      expiresIn : 60*60*5*5
    })
    return jwtToken
  }catch(err){
    throw(err)
  }
}


module.exports.decodeToken = async (token) => {
  try{
    const payload = await jwt.verify(token, publicKey, {
      algorithm : 'RS256'
    })
    return payload
  }catch(err){
    throw err
  }
}

module.exports.refreshToken = async (options) => {
  try{
    const payload = jwt.verify(options.accessToken, publicKey, {algorithm: 'RS256', ignoreExpiration : true})
    const {refresh} = await User.findOne({id : payload.sub})
    await jwt.verify(options.refreshToken, refresh, {algorithm : 'HS256'})
    delete payload.iat;
    delete payload.exp;
    delete payload.nbf;
    delete payload.jti
    return await this.createAccessToken({user_id : payload.sub})

  }catch(err){
    throw err
  }
}