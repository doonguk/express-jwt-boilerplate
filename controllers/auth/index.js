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

module.exports.putAuth = new ApiRouter({
  name : '',
  method : 'put',
  summary: 'edit password',
  tags : ['Auth'],
  isPublic : false,
  responses : {
    200 : { description : 'Success Change'},
    404 : { description : 'Not Found' }
  },
  handler : ctrl.putAuth
})

module.exports.deleteAuth = new ApiRouter({
  name : '',
  method : 'delete',
  summary : 'Sign Out',
  tags : ['Auth'],
  responses : {
    201 : { description : 'Sign Out Success '}
  },
  handler : ctrl.deleteAuth
})

module.exports.postRefresh = new ApiRouter({
  name : 'refresh',
  method : 'post',
  schema : 'PostRefresh',
  summary : 'Refresh Token',
  tags : ['Auth'],
  isPublic : true,
  responses : {
    201 : { description : 'New Access Token is created'}
  },
  handler : ctrl.postRefresh
})