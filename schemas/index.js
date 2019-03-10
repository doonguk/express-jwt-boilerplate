
const fs = require('fs')
const path = require('path')
const Ajv = require('ajv');
const defaultAjv = new Ajv({userDefaults : true, removeAdditional: true, coerceTypes : 'array'})


function assignAllJswon(dir, all){
  fs.readdirSync(dir)
      .forEach( target => {
        const targetDir = path.join(dir,target)
        if(fs.statSync(targetDir).isDirectory()){
          assignAllJswon(targetDir,all)
        }
        if(target.endsWith('.json')){
          const key = target.replace('.json','')
          all[key] = require(targetDir)
        }
      })
  return all;
}

function convert(data, schema, option){
  if(!schema) throw 'schema is undefined!'
  const components = Object.assign({}, this.entry)
  delete components[schema]
  const ajvObject = Object.assign({}, this.entry[schema]);
  ajvObject.components = { schemas : components }

  let ajv
  if(option) ajv = new Ajv(option)
  else ajv = defaultAjv

  if(!ajv.validate(ajvObject, data)){
   throw ajv.errorsText()
  }
}



module.exports = {
 entry : assignAllJswon(__dirname,{}),
 convert
}