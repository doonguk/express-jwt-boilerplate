'use strict'
const User = require('../../models/user');
const db = require('../../components/db');

module.exports.postRegister = async (req, res, next) => {
  const connection = db.beginTransaction()
  try{
    const { email, password } = req.option
    const { user, refreshHash } = await User.createUser({email, password}, connection)
  }catch(err){
    await db.rollback(connection)
  }
}