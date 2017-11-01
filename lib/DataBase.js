
/*
	descripcion:Clase encargada de el manejo de base de datos por inyeccion de dependencia.
	params:Configuracion de la base de datos a la que se conectara y con el manejador que lo ara.
*/

function DataBase(conf){
	
	var driver=conf.driver.split(":")[0];
	switch(driver)
	{
		case "sequelize":
		{
			
			var SequelizeHandle=require("./SequelizeHandle").SequelizeHandle;
			this.__proto__=new SequelizeHandle(conf);
		}break;
		default:
		{
			console.log("No existe el driver de la base datos.");
		}break;
		
	}
}


module.exports=DataBase;