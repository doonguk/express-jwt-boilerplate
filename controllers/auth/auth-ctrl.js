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

module.exports.putAuth = async(req, res, next) => {
  try{
    const { password, newPassword } = req.option
    if(password === newPassword ) res.status(409).json()
    const user = await User.findOne({id : req.user_id})
    if( user && User.verifyPassword(password, user.password, user.salt)){
      const refreshHash = await User.updatePassword(newPassword, req.user_id)
      const refreshToken = await jwt.createRefreshToken({user_id : req.option}, refreshHash)
      res.status(200).json({refreshToken})
    }
    else{
      res.status(404).json()
    }
  }catch(err){
    next(err)
  }
}

module.exports.deleteAuth = async (req, res, next) => {
  try{
    res.status(204).json()
  }catch(err){
    next(err)
  }
}

module.exports.postRefresh = async (req, res, next) => {
  try{
    const accessToken = await jwt.refreshToken(req.option)
    res.status(201).json({accessToken})
  }catch(err){
    next(err)
  }
}