
const Schema = require('../schemas/index')


async function verifyOptions(path, schema, req){
  const options = await Object.assign({}, req.query, req.body)
  try{
    // if(path){}
    if(schema) Schema.convert(options, schema, {coerceTypes : 'array'})
  }catch(err){
    throw { status : 400, message : err}
  }
  return {...options, ...req.params}
}

module.exports  = (path, schema) => {
  return async (req, res, next) =>{
    try{
      req.option = await verifyOptions(path, schema, req)
      next()
    }catch(err){
      next(err)
    }
  }
}