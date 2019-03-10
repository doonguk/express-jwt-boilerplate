# express-jwt-tutorial

##  1. router load

> router 폴더의 index.js 에서 라우팅 폴더를 읽어서 router load

### 루트 경로의 routes/index.js 에 app 객체를 넣어서 라우팅을 지정해준다

```javascript
/* routes/indexjs */

const fs = require('fs')
const path = require('path')
const ApiRouter = require('../controllers/default').ApiRouter
const excluded = ['/']

function loadRoutes(dir, currentDir, app){
    fs.readDirSync(dir)
        .forEach( target => {
        const targetDir = path.join(dir,target)
        const routePath = path.relative(currentDir, targetDir).replace('/index.js','')
        if(fs.lstatSync(targetDir),isDirectory()){
            loadRoutes(targetDir,currentDir,app)
        }
        else if( target === 'index.js' && !excluded.includes(routePath)){
            const requirePath = path.relative(__dirname, targetDir)
            const file = require(`./${requirePath}`)
            getController(routePath, file, app) // 지정된 라우팅경로에 Controller, 미들웨어 적용
        }
    })
}
module.exports = (app) => {
    loadRoutes(__dirname, __dirname, app),
    loadRoutes(__dirname + '../controllers', __dirname+"../controllers")
}
```

express app을 routes폴더의 index.js에서 exports한 함수의 파라미터로 넣어준다. 후에 controllers폴더에 라우팅 관련 코드를 작성할 건데 위와 같이 코딩 할 경우 라우트 관련 코드가 추가 될 때 마다 별도의 작업없이 app객체에 라우팅을 지정해 줄 수 있다.

app에 컨트롤러,미들웨어를 적용시키기 전에 회원가입 api 구조 설계부터 하겠다.

```javascript
/* controllers/default.js */
module.exports.ApiRouter = class{
  constructor(object){
    this.name = object.name
    this.method = object.method || 'get'
    this.summary = object.summary || ''
    this.description = object.description
    this.tags = object.tags || [];
    this.paths = object.paths;
    this.schema = object.schema;
    this.handler = object.handler;
    this.parameters = object.parameters || []
    this.responses = object.responses || {200 : {description : 'Success'}};
    this.contentType = object.contentType || 'application/json';
    this.middleware = object.middleware || [];
    this.isPublic = object.isPublic || false;
    this.fileNames = object.fileNames || [];
  }
}
```

Controllers 폴더안의 default.js 에 Api 들의 클래스 형식을 지정해준다.  

```javascript
/* controllers/auth/index.js */
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
```

'use strict' 는 말 그대로 코드를 엄격하게 작성한다는 뜻이다( 생활화 하자 ) 위에서 ApiRouter 클래스의 인스턴스로 createUser 객체를 export 하였다.  postRegister 함수는 후에 /auth/register 경로로 request가 요청이 들어오면 처리해주는 함수이다.

```javascript
(...)
function getController(path, obj, app){
  if(typeof obj === 'function'){
    app.use(path,obj)
  }
  else{
    Object.keys(obj).forEach( key => {
      if( key instanceof ApiRouter ){
        const ctrl = obj[key]
        let url;
        if(typeof ctrl.name === 'string'){
          url = ctrl.name.length > 0 ? `${path}/${ctrl.name}` : path
        }
        else{
          url = `${path}/${key}`;
        }
        const args = [requestMiddleware(ctrl.path, ctrl.schema),...ctrl.middleware, ctrl.handler]
        app[ctrl.method](url, args) //ex)app.post(/auth/register, ...middleware)

      }
    })
  }
}
(...)
```

loadRoutes에 이어 각 라우팅에 컨트롤러를 붙여주는 코드이다. loadRoutes 함수로 부터 routePath, file, app 을 파라미터로 전달 받아 라우팅 url 을 지정해주고 args에 미들웨어를 적용해준다. 위 코드에서 requestMiddleware 는 request 객체의 스키마가 올바른지 Ajv모듈을 이용하여 검증하는 역할, req.option 에 req.body, req.query 등 을 저장해주는 미들웨어이다. 



## 2.  model 작성, controllers 구현

### 1) 데이터베이스 연결

디비는 mysql 를 사용하였다.

```json
"scripts": {
  "start": "NODE_ENV=production node ./bin/www",
  "local" : "NODE_ENV=local nodemon ./bin/www"
},
```

 디비 연동전 NODE_ENV 를 production 과 local 둘로 나누어 package.json의 scripts 부분을 서로 다른 방식으로 빌드 되게 구현 하였다. config 폴더에 local 과 production에 맞는 config 파일을 작성 해 주었다.

```javascript
/*components/db.js*/
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
```

위에서 작성한 config 파일을 이용하여 mysql pool 을 생성한다 pool 을 이용하는 방식은 query에 다중작업이 필요한 경우 pool에 요청을 해서 컨넥션을 받아 트랜잭션을 수행 한 뒤 반납하는 구조이다. 트랜잭션이 필요하지 않은 경우 pool에 직접 요청을 한 뒤 작업이 끝나면 반납하는 구조이다. 중간에 오류가 생긴다면 rollback하여 connection을 release 한다.

```javascript
/*models/user*/
'use strict'

const db = require('../components/db')
const crypto = require('crypto')

module.exports.tableName = 'backend-tutorial'

async function generateRandomHash(length){
  try{
    return await crypto.randomBytes(length).toString('base64')
  }catch(err){
    throw err;
  }
}
function createPasswordHash(password){
  return new Promise((resolve, reject) => {
    const salt = generateRandomHash(64)
    crypto.pbkdf2(password, salt, 104236, 64,'sha512', (err,key) => {
      if(err) reject(err);
      else resolve ({ password : key.toString('base64'), salt})
    })
  })
}

module.exports.createUser = async( option, connection ) => {
  try{
    const refreshHash = generateRandomHash(64)
    const passwordHash = await createPasswordHash(option.password)
    const { insertId } = await db.query({
      connection : connection,
      sql : `INSERT INTO ?? SET ?`,
      values : [this.tableName, {email : option.email, password :passwordHash.password, salt : passwordHash.salt, refresh : refreshHash }]
    })
    option.user_id = insertId
    delete option.password
    return { user : option, refreshHash }
  }catch(err){
    throw(err)
  }
}
```

모델은 데이터베이스와 직접 작업을 수행하는 코드로 연결되어 있다. 유저가 request 객체에 email 과 password 를 보내면 requestMiddleware를 통해 req.option 값에 email과 password가 저장 될텐데 이를 auth 컨트롤러에서 model 쪽으로 connection 과 함께 전송한다. 

데이터베이스에 비밀번호를 저장할 때 에는 그냥 저장 할 경우 보안상에 좋지 않기 때문에 hash 한 값을 저장한다. 단뱡향 데이터 처리에서 단순 hash 한 값을 저장 할 경우에도 역시 보안상에 오류가 있을 수 있다. 그래서 소금 즉 salt 값을 뿌려서 해싱을 한 값을 데이터베이스에 저장한다.

refreshHash 값은 이후에 할 Jwt 토큰 발행을 위해서 데이터베이스에 저장한다.

### 2)  JWT

```javascript
/*lib/jwt/index.js*/

const jwt = require('jsonwebtoken')
const fs = require('fs')
const User = require('../../models/user')
const privateKey = fs.readFileSync(`${__dirname}/private.pem`)
const publicKey = fs.readFileSync(`${__dirname}/public.pem`)

module.exports.refreshToken = async (options) => {
  try {
    const payload = await jwt.verify(options.accessToken, publicKey, {algorithms: 'RS256', ignoreExpiration: true})
    const {refresh} = await User.findOne({user_id: payload.sub})
    await jwt.verify(options.refreshToken, refresh, {algorithms: 'HS256'})
    delete payload.iat;
    delete payload.exp;
    delete payload.nbf;
    delete payload.jti
    return await this.createAccessToken({ user_id : payload.sub})
  } catch (err) {
    throw {status: 401, message: err}
  }
}

module.exports.createAccessToken = async (data) => {
  try {
    const payload = {
      sub: data.user_id
    }
    return await jwt.sign(payload, privateKey,
      {
        algorithm: 'RS256',
        expiresIn: 60 * 60
      }) // token 발급 jwt.sign(payload, secret, option,[call back])
  } catch (err) {
    throw err
  }
}

module.exports.createRefreshToken = async (data, tokenSecret) => {
  try {
    const payload = {
      sub: data.user_id
    }
    return await jwt.sign(payload, tokenSecret,
      {
        algorithm: 'HS256',
        expiresIn: 60 * 60 * 24 * 6
      })
  } catch (err) {
    throw err
  }
}

module.exports.decodeToken = async (token) => {
  try {
    console.log(token)
    return await jwt.verify(token, publicKey, {algorithms: 'RS256'})
  } catch (err) {
    throw {status: 401, message: err}
  }
}
```

Json Web Token(JWT) 은 웹표즌 으로서 두 개체에서 JSON객체를 사용하여 가볍고 자가수용적(self-contained)방식으로 정보를 안정성 있게 전달해준다.

토큰을 생성할 때 에는 jwt.sign(payload, secret, option)

토큰을 검증할 때 에는 jwt.verify(token, secret, option) 구조이며 올바르게 검증할 경우 payload값이 return 된다.

Sign up 할 경우 accessToken, refreshToken 을 response 하고 client 는 서버에 요청을 할 때 이 토큰을 request.headers 에 실어 보내고 서버는 이를 검증하여 해당 유저의 요청을 처리 한다. 만약 accessToken 이 만료 될경우 refresh 토큰을 이용하여 해당 유저를 검증 한뒤 accessToken 을 재발급 해주는 구조이다.

