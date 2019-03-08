const  fs = require('fs');
const path =require('path');
const ApiRouter = require('../controllers/default').ApiRouter
const requestMiddleware = require('../middlewares/request')

const excluded = ['/']

function getController(path, obj, app){
  if(typeof obj === 'function'){
    app.use(path, obj)
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
        app[ctrl.method](url, args)

      }
    })
  }
}
function loadRoutes(dir, currentDir, app){
  fs.readdirSync(dir)
      .forEach((target)=>{
        const targetDir = path.join(dir,target)
        const routePath = '/' + path.relative(currentDir,targetDir).replace('/index.js','')
        if(fs.lstatSync(targetDir).isDirectory()){
          loadRoutes(targetDir, currentDir, app)
        }
        else if( target === 'index.js' && !excluded.includes(routePath)){
          const requirePath = path.relative(__dirname, targetDir)
          const file = require(`./${requirePath}`);
          getController(routePath, file, app)
        }
      })
}


module.exports = (app) => {
  loadRoutes(__dirname, __dirname, app)
  loadRoutes(path.join(__dirname,'../controllers'), path.join(__dirname, '../controllers'), app)
}