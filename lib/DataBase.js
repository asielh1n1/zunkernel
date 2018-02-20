
/*
	descripcion:Clase encargada de el manejo de base de datos por inyeccion de dependencia.
	params:Configuracion de la base de datos a la que se conectara y con el manejador que lo ara.
*/

function DataBase(conf){
	if(!conf.driver)
		return zun.console("The var 'driver' not exist in the bundle",'error');
	if(/sequelize:/.test(conf.driver))
		var driver=conf.driver.split(":")[0];
	else var driver=conf.driver;	
	switch(driver)
	{
		case "sequelize":
		{
			//var SequelizeHandle=require("./SequelizeHandle").SequelizeHandle;
			var dialect=conf.driver.split(":")[1];
			if(dialect=='none')
				return this.__proto__={}
			var host=conf.host.split("\\");
			this.__proto__= new zun.sequelize(conf.name,conf.username,conf.password, {
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
			this.authenticate()
			.then(function(){
				setTimeout(function() {
					zun.emit('db_connect',null)
				},2000);
			})
			.catch(function(error){
				setTimeout(function() {
					zun.emit('db_connect',error)
				},2000);
			});
		}break;
		case "mongodb":
		{
			var uri='mongodb://'+conf.username+':'+conf.password+'@' + conf.host+':'+conf.port + '/' + conf.name;
			zun.mongoose.connect(uri,function(error) {
				setTimeout(function() {
					if(Object.keys(error).length !== 0 && error.constructor !== Object)
						zun.emit('db_connect',error)
					else zun.emit('db_connect',null)
				},2000);
			});
			this.__proto__ = zun.mongoose.connection;
		} break;
		default:
		{
			zun.console("This database driver is not support yet.",'error');
		}break;
		
	}
}


module.exports=DataBase;