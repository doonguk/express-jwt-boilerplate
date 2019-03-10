'use strict'

const jwt = require('../lib/jwt')

module.exports = async (req, res, next) => {
  try {
    const { authorization } = req.headers
    if( authorization && authorization.split(' ')[0] === 'Bearer'){
      const token = authorization.split(' ')[1]
      const jwtToken = await jwt.decodeToken(token)
      if(jwtToken.sub){
      req.user_id = jwtToken.sub
      next()
      }
    }
    else{
      next({status : 401, message : 'invalid access token'})
    }
    }catch(err){
    next(err)
  }
}