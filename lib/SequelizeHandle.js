
/*
	Manejador de base de datos de Sequelize
	con el modulo mssql
*/
module.exports.SequelizeHandle=function(conf){
    try{
        //Modulo que hace funcion de ORM para Postgress,SQL Server,MySql
        Sequelize = require('sequelize');
    }catch (error){
        return zun.console("No sequelize module not found","error")
    }

    var dialect=conf.driver.split(":")[1];
    if(dialect=='none')
        return this.__proto__={}
    var host=conf.host.split("\\");
    this.__proto__= new Sequelize(conf.name,conf.username,conf.password, {
        host: host[0],
        dialect:dialect,
        port:conf.port,
        "dialectOptions": {
            "instanceName": (host[1])?host[1]:""
        },
        logging:(conf.logging)?true:false,
        define: {
            timestamps: false
        },        storage:(conf.path)?conf.path:''
    });
  
}
