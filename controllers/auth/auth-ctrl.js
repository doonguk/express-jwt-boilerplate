'use strict'
const User = require('../../models/user');
const db = require('../../components/db');
const jwt = require('../../lib/jwt')

module.exports.postRegister = async (req, res, next) => {
  const connection = await db.beginTransaction()
  try{
    const { email, password } = req.option
    const { user, refreshHash } = await User.createUser({email, password}, connection)
    const accessToken = await jwt.createAccessToken(user)
    const refreshToken = await jwt.createRefreshToken(user, refreshHash)
    await db.commit(connection)
    res.status(201).json({accessToken, refreshToken})
  }catch(err){
    await db.rollback(connection)
    next(err)
  }
}

module.exports.postAuth = async(req, res, next) => {
  try {
    const {email, password} = req.option
    const user = await User.findOne({email})
    if (user && User.verifyPassword(password, user.password, user.salt)) {
      const accessToken = await jwt.createAccessToken({user_id: user.id})
      const refreshToken = await jwt.createRefreshToken({user_id:user.id}, user.refresh)
      res.status(200).json({accessToken, refreshToken})
    }
    else{
      res.status(404).json()
    }
  }catch(err){
    next(err)
  }
}