'use strict'
const createError = require('http-errors')
const serializeError = require('serialize-error')

function errorHandler(err, req, res, next){
  if( err && req.app.get('env') === 'production'){
    console.log('@areq.app.get(env)',req.app)
    console.log('err',err)
    delete err.stack
  }
  else{
    console.log(err)
  }
  console.log(err);
  const status = err.status ? err.status : 500
  delete err.status
  res.status(status).json(serializeError(err) || {}).end()
}


module.exports = (app) => {
  app.use( function(req, res, next){
    next(createError(404))
  })
  app.use(errorHandler)
}