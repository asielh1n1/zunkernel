
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
			var SequelizeHandle=require("./SequelizeHandle").SequelizeHandle;
			this.__proto__=new SequelizeHandle(conf);
		}break;
		case "mongodb":
		{
			var uri='mongodb://'+conf.username+':'+conf.password+'@' + conf.host+':'+conf.port + '/' + conf.name;
			zun.mongoose.connect(uri,function(error) {
				setTimeout(function() {
					zun.emit('db_connect',error)
				},1500);
			});
			this.__proto__ = zun.mongoose.connection;
		} break;
		default:
		{
			zun.console("No existe el driver de la base datos.",'error');
		}break;
		
	}
}


module.exports=DataBase;