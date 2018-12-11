
/*
	descripcion:Clase encargada de el manejo de base de datos por inyeccion de dependencia.
	params:Configuracion de la base de datos a la que se conectara y con el manejador que lo ara.
*/

function DataBase(conf){
	if(!conf.driver)
		return zun.console("The var 'driver' not exist in the bundle",'error');	
	switch(conf.driver)
	{
		case "sequelize":
		{
			this.__proto__= new zun.sequelize(conf.name,conf.username,conf.password,conf.options);
			this.authenticate()
			.then(function(){
				//zun.console('- Driver sequelize conected successfully!!');
				zun.emit('db_connect',null)
			})
			.catch(function(error){
				//zun.console('- Error conect driver sequelize!!','error');
				zun.emit('db_connect',error);
			});
		}break;
		case "mongoose":
		{
			var auth=(conf.username && conf.password)?conf.username+':'+conf.password+'@':'';
			var uri='mongodb://'+ auth + conf.host +':'+ conf.port + '/' + conf.name;			
			zun.mongoose.connect(uri,conf.options)
			.then(function(){
				//zun.console('- Driver mongoose conected successfully!!');
				zun.emit('db_connect',null)
			})
			.catch(function(error){
				//zun.console('- Error conect driver mongoose!!','error');
				zun.emit('db_connect',error);
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