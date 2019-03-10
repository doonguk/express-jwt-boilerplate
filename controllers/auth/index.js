'user strict'

const ApiRouter = require('../default').ApiRouter
const ctrl = require('./auth-ctrl')

module.exports.createUser = new ApiRouter({
  name : 'register',
  method : 'post',
  summary : 'Sign up',
  tags : ['Auth'],
  schema : 'PostAuth',
  isPublic : true,
  responses : {
    201 : { description : 'Sign Up Success' },
    409 : { description : 'user_id is duplicate'}
  },
  handler : ctrl.postRegister
})

module.exports.postAuth = new ApiRouter({
  name : '',
  method : 'post',
  summary: 'Sign in',
  tags : ['Auth'],
  schema : 'PostAuth',
  isPublic : true,
  responses : {
    200 : { description : 'Sign in Success'},
    404 : { description : 'Not Found'}
  },
  handler: ctrl.postAuth
})