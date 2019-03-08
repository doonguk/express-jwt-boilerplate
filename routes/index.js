const  fs = require('fs');
const path =require('path');


const excluded = ['/']

function getController(path, obj, app){

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
  loadRoutes()
}