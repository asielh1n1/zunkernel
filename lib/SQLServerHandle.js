

/*
	Manejador de base de datos de Sql Server
	con el modulo mssql
*/
module.exports.SQLServerHandle=function(conf){
	
	var sqlDb = require("mssql");
	
	this.dbConfig={
	    user:conf.username,
	    password: conf.password,
	    server: conf.host,
	    database: conf.name
	}

	//Hacer consultas sencillas a la bd
	//Le pasas la consulta y la funcion donde devolver los datos
	//El parametro params es un array key-value para evitar inyecciones sql
	this.query = function (sql, callback,params) {
	    var conn = new sqlDb.Connection(this.dbConfig);
	    conn.connect()
	    .then(function () {
	        var req = new sqlDb.Request(conn);
			if(params){
				for(i in params){
					var raw_key=i.split("-");
					eval('req.input("'+raw_key[0]+'",'+((raw_key[1])?'sqlDb.'+raw_key[1]:'sqlDb.VarChar')+',"'+params[i]+'")');
				}
			}			
	        req.query(sql)
	        .then(function (recordset) {
	            callback(recordset);
	        })
	        .catch(function (err) {
	            callback(undefined, err);
	        });
	    })
	    .catch(function (err) {
	        callback(undefined, err);
	    });

	    conn.on('error', function(err) {
			callback(undefined,err);
		});
	};
	//Te devuelve el string de una transaccion dado la consulta que quieras hacer
	this.transaction=function(Stringsql){
		var sql=" DECLARE @new_id INT";
		sql+=" BEGIN TRAN";
		sql+=" BEGIN TRY"
		sql+=Stringsql;
		sql+=" COMMIT TRANSACTION";
		sql+=" END TRY";
		sql+=" BEGIN CATCH";
		sql+=" ROLLBACK TRANSACTION";
		sql+=" select ERROR_MESSAGE();";
		sql+=" END CATCH";
		return sql;
	}

  
}