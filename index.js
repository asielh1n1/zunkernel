//Modulos Utilizados en el framework
var fs = require('fs');
var path = require('path');
var DataBase = new require("./lib/DataBase");
var ExpressHandler = new require("./lib/express").ExpressHandler;
var crypto = require('crypto');
var swig = require('swig-templates');
var HandleCommand = require('./lib/command').Command;

/**
 * @description  Descripcion:Clase base del Framework,es el nucleo del sistema.
 Carga las configuraciones por bundles y ademas de los routing para cada bundle
 *
 * @param {*} mode
 */
exports.ZunKernel = function () {

	this.mode = null;
	var _this = this;	
	this.listeners = new Array();
	this.handlerExpress = new ExpressHandler();
	this.Command=null;
	//Ruta raiz donde esta alojado el proyecto
	this.basedir = path.dirname(path.dirname(__dirname));
	//Express framework
	this.express = null;
	//Object access database
	this.Database = DataBase;
	//Object template engine
	this.swig = swig;
	//Object driver mongoose
	this.mongoose = null;
	//Object driver sequelize
	this.sequelize = null;
	//Object driver send email
	this.nodemailer = null;
	this.jsonwebtoken = require('jsonwebtoken');
	this.model={}
	this.repository={}
	this.db=null;
	//Variable que almacena las configuraciones generales
	_this.config = null;
	_this.Command = new HandleCommand();
		

	this.useCustom={
		templateEngine:null,
		db:null,
		express:null,
		authenticate:null,
		handleError:null
	}

	zun = this;

	this.init=function(mode) {
		_this.mode=mode;
		_this.folderSystem();	
		_this.swig.setDefaults({ cache: false });	
		//Almaceno las configuraciones generales
		_this.loadGeneralConfig();
		_this.Command.defaultCommand();				
		loadConfigByBundle();
		loadModelByBundle();		
		switch (mode) {
			case 'production':
			{
				console.log('---ZUNFRAMEWORK---');
				_this.handlerExpress.initWebServer();
				_this.loadRoutingByBundles();
				//Hay que evitar que los desarrolladores cambien las variables del objeto zun
				Object.freeze(zun);
			} break;
			case 'command':
			{
				
				zun.console('--------ZUNFRAMEWORK--------');
									
			} break;
			default:
			{
				console.log('\033[31m', "This mode of initialize zun framework not exist", '\x1b[0m');
			} break;
		}
	}


	//Cargo las configuraciones generales del framework
	this.loadGeneralConfig = function () {
		//Cargo las configuraciones generales del framework
		try {
			
			//Creo una bd para ese bundle para el acceso a la bd de ese bundle
			if (zun.config.database) {
				var driver = zun.config.database.driver;
				switch (driver) {
					case 'sequelize':{
						try {
							zun.sequelize = require('sequelize');
						} catch (error) {
							zun.console("You must install the driver for sequelize.\n npm install --save sequelize", 'error');
						}
						zun.db = new DataBase(zun.config.database);
					}break;
					case 'mongoose':{
						try {
							_this.mongoose = require('mongoose');
						} catch (error) {
							zun.console("You must install the driver for mongoose in the bundle.\n npm install --save mongoose", 'error');
						}
						zun.db = new DataBase(zun.config.database)
					}break;
					default:{
						if(_this.useCustom.db){
							zun.db=_this.useCustom.db(zun.config.db)
						}
					}break;
				}
			}

			//Verifico que esta la variable de configuracion de correo y creo una variable global para ese bundle
			if (zun.config.email) {
				try {
					_this.nodemailer = require('nodemailer');
				} catch (error) {
					//zun.console("Nodemailer module not found","warning")
				}

			}
		} catch (error) {
			return console.log('\033[31m', 'Error load config file.\n' + __dirname + "/config.js. " + error.message, '\x1b[0m');
		}
	}


	this.sendMail = function (mailOptions) {
		if (!_this.nodemailer) throw new Error('zun.nodemailer is not defined. Please install nodemailer.')
		return new Promise(function (resolve, reject) {
			var transporter = _this.nodemailer.createTransport(zun.config.email);
			transporter.sendMail(mailOptions, function (error, info) {
				if (error) return reject(error);
				resolve(info);
			})
		})

	}
	//Carga los routing por bundles	
	this.loadRoutingByBundles=function() {
		//Verifico que exista la variable bundle en el config
		if (!zun.config.bundles.length)
			return zun.console('There is no bundle even. To create a bundle you can use the command "zun create-bundle"','warning')
		for (i in _this.config.bundles){
			try {
				var config = JSON.parse(fs.readFileSync(_this.basedir + '/bundles/' + _this.config.bundles[i].name + '/config/config.json', "utf-8"));
				//Ejecuto cada uno de los ruting de ese bundle
				for (k in config.router) {
					//Cargo el archivo de routing del bundle
					var rounting = JSON.parse(fs.readFileSync(_this.basedir + '/bundles/' + _this.config.bundles[i].name + '/config/' + config.router[k], "utf-8"));
					//Se lo asigno a una variable global que se puede llamar desde cualquier parte del codigo
					for (j in rounting) {
						var url = _this.config.bundles[i].router + rounting[j].url;
						var method=rounting[j].method.toLowerCase();
						url = url.replace("//", "/");
						var roles = (rounting[j].roles) ? rounting[j].roles : null;
						if(/\w\.\w/ig.test(rounting[j].fn)){
							var auxFn=rounting[j].fn.split('.');
							var fn = require(_this.basedir + "/bundles/" + _this.config.bundles[i].name + '/controller/' + rounting[j].controller)[auxFn[0]][auxFn[1]];
						}else var fn = require(_this.basedir + "/bundles/" + _this.config.bundles[i].name + '/controller/' + rounting[j].controller)[rounting[j].fn];
						var values = {
							roles:roles,
							url: url,
							method: method,
							bundle: _this.config.bundles[i].name,
							controller: rounting[j].controller,
							fn: fn
						}
						_this.express[method](url,middleWare(values),fn);
					}
				}

			}catch(e){
				console.log('\033[31m', "Error load routing zunkernel", '\x1b[0m');
				console.log('\033[31m', e, '\x1b[0m');
			}
		}
		//Manejo los errores que ocurran 
		_this.express.use(function(err,req,res,next){
			if(err){
				err.statusCode=500;
				return _this.zunHandleError(err,req,res);	
			}
			return;
		})
		//manejo los codigos 404(page not found)
		zun.express.use(function(req,res,next){
			return zun.zunHandleError({statusCode:404},req,res);
		})
		//Configuro la base de datos personalizada del usuario
		if(_this.useCustom.db){
			zun.db=_this.useCustom.db(zun.config.database);
		}
	}
	//Funcion intermedia para ejecutar los controladores dada una ruta
	function middleWare(dataRouting) {
		return function(req,res,next){
			req.zunAuthenticate=zunAuthenticate;
			req.zunLogout=zunLogout;
			var roles=null;
			//Valido que la ruta esta auntenticada por session
			if(req.session.zunAuthenticateId){
				roles=req.session.zunAuthenticateRoles;
				req.session.zunsession={id:req.session.zunAuthenticateId,roles:req.session.zunAuthenticateRoles};
				if(req.method=='POST' || req.method=='PUT' || req.method=='DELETE'){
					//Verifico que tenga el token CSRF
					var csrf_token = req.body[zun.config.webserver.csrf.token_name] || req.query[zun.config.webserver.csrf.token_name] || req.headers[zun.config.webserver.csrf.token_name];
					if(!csrf_token)return zun.zunHandleError({statusCode:405},req,res);
					try {
						_this.jsonwebtoken.verify(csrf_token,zun.config.webserver.csrf.secret);
					} catch(err) {
						return zun.zunHandleError({statusCode:405},req,res);
					}
				}
			}	
			//Valido que la ruta esta auntenticada por jsonwebtoken
			var token = req.body[zun.config.webserver.jsonwebtoken.body_name] || req.query[zun.config.webserver.jsonwebtoken.get_query_name] || req.headers[zun.config.webserver.jsonwebtoken.header_http_name];
			if(token){
				try {
					var decoded = _this.jsonwebtoken.verify(token,zun.config.webserver.jsonwebtoken.secret);
					roles=decoded.roles;
					req.session.zunsession=decoded;
				} catch(err) {
					return zun.zunHandleError({statusCode:403},req,res);
				}
			}
			//Verifico si tiene rol
			if (dataRouting.roles) {
				//Si tiene roles en el routing y ademas la variable role en la session
				if (dataRouting.roles && !roles)
					return zun.zunHandleError({statusCode:403},req,res);
				if (typeof (dataRouting.roles) == "string" && typeof (roles) == "string" && dataRouting.roles != roles)
					return zun.zunHandleError({statusCode:403},req,res);
				if (dataRouting.roles instanceof Array && (typeof (roles) == 'number' || typeof (roles) == "string")) {
					if (dataRouting.roles.length && dataRouting.roles.indexOf(roles) == -1)
						return zun.zunHandleError({statusCode:403},req,res);
				}
				if (roles instanceof Array && (typeof (dataRouting.roles) == 'number' || typeof (dataRouting.roles) == "string")) {
					if (dataRouting.role.length && roles.indexOf(dataRouting.roles) == -1)
						return zun.zunHandleError({statusCode:403},req,res);
				}
				if (roles instanceof Array && dataRouting.roles instanceof Array) {
					var exist = false;
					for (var i in dataRouting.roles) {
						for (var j in roles) {
							if (roles[j] == dataRouting.roles[i])
								exist = true;
						}
					}
					if (!exist)
						return zun.zunHandleError({statusCode:403},req,res);
				}
			}
			next();
		}
		
	}

	//Funcion que permite authenticar a un usuario
	function zunAuthenticate(options){
		if(!options || !options.id)throw new Error('The param options.id is required in zunAuthenticate.');
		options.type=(options.type)?options.type:'session';
		options.roles=(options.roles)?options.roles:null;
		switch (options.type) {
			case 'session':{
				console.log(options)
				this.session.zunAuthenticateId=options.id;
				this.session.zunAuthenticateRoles=options.roles
				return true;
			}break;
			case 'jsonwebtoken':{
				var data=(options.data)?options.data:null
				var token = _this.jsonwebtoken.sign({ id: options.id,roles:options.roles,data:data }, zun.config.webserver.jsonwebtoken.secret, { algorithm: zun.config.webserver.jsonwebtoken.algorithm,expiresIn: zun.config.webserver.jsonwebtoken.expires * 60});
				return token;
			}break;		
			default:{
				throw new Error('This type authentication is not valid.');
			}break;
		}
	}

	function zunLogout(){
		this.session.destroy();
	}

	//Funcion que devuelve true o false si el bundle existe o no en el framework registrado
	this.existBundle = function (name) {
		for (i in _this.config.bundles) {
			if (_this.config.bundles[i].name == name)
				return true;
		}
		return false;
	}

	this.getTokenCSRF=function(){
		return _this.jsonwebtoken.sign({}, zun.config.webserver.csrf.secret, { algorithm: 'HS256',expiresIn: zun.config.webserver.csrf.expires * 60});
	}

	function loadConfigByBundle() {

		//Verifico que exista la variable bundle en el config
		if (!_this.config.bundles)
			return console.log('\033[31m', 'Error to load bundles. Var bundles do not exist in the config file.\n' + _this.basedir + "/config/config.js", '\x1b[0m');		
		for (var i in _this.config.bundles) {
			try {
				zun[_this.config.bundles[i].name] = {}
				//Cargo el archivo de configuracion del bundle
				var conf_bundle = fs.readFileSync(_this.basedir + '/bundles/' + _this.config.bundles[i].name + '/config/config.json', "utf-8");
				//Se lo asigno a una variable global que se puede llamar desde cualquier parte del codigo
				try {
					conf_bundle = JSON.parse(conf_bundle);
				} catch (error) {
					zun.console('Error parse config.json in the bundle:' + _this.config.bundles[i].name)
					continue;
				}
				//Cada nombre que se le ponga al bundle seria una variable global que se pueda utilizar
				//con las configuraciones de ese bundle.
				zun[_this.config.bundles[i].name].config = conf_bundle
				//Evaluo las configuraciones por si tiene implicita alguna variable
				evaluateObject(zun[_this.config.bundles[i].name].config);

				//Creo una variable render para ese bundle para el motor de plantilla de ese bundle	
				eval("zun[_this.config.bundles[i].name].render=function(file,params){return zun.renderFile(file,params,'" + _this.config.bundles[i].name + "')}");
				

				//Archivo que se ejecuta sin haber cargado los controller
				if (/\.js$/ig.test(_this.config.bundles[i].main)) {
					require(_this.basedir + '/bundles/' + _this.config.bundles[i].name + '/' + _this.config.bundles[i].main);
				}
				/////////////////////////////////////////////////////////////////////////////////////////////////////////////
				////////////////Cargo los repositorios del bundle///////////////////////////////
				var repositoryDir = _this.basedir + "/bundles/" + _this.config.bundles[i].name + "/repository/";
				
				if (fs.existsSync(repositoryDir)) {
					try {
						var listFiles = fs.readdirSync(repositoryDir);
						for (var j in listFiles) {
							require(repositoryDir + listFiles[j])
						}
					} catch (error) {
						zun.console('Folder repository no exist in the bundle ' + _this.config.bundles[i].name, 'warning');
						console.log(error);

					}
				}
				/////////////////////////////////////////////////////////////////////////////////	

			} catch (e) {
				console.log('\033[31m', e, '\x1b[0m');
			}
		}
	}

	this.renderFile = function (file, data, bundle_name) {
		var result = "";
		if (fs.existsSync(file))
			var renderDir = file;
		else var renderDir = _this.basedir + '/bundles/' + bundle_name + '/view/' + file;
		if (!fs.existsSync(renderDir)) {
			zun.console("File to render not found. Path:"+renderDir, "error");
			return "Error!! file not found";
		}
		var rawTemplate=fs.readFileSync(renderDir,'utf-8');
		return _this.render(rawTemplate,data);
	}

	this.render = function (template, data) {
		if(!data)data={}
		//Agrego el token csrf
		data.zunframework_csrf_token=_this.getTokenCSRF();
		data.zunframework_csrf_token_name=zun.config.webserver.csrf.token_name;

		if(!_this.useCustom.templateEngine)
			return _this.swig.render(template, { locals: data,filename:Date.now().toString()});
		else {
			return _this.useCustom.templateEngine(template,data) 
		}
	}

	this.zunHandleError=function(error,req,res){
		if(zun.useCustom.handleError)
			return zun.useCustom.handleError(error,req,res);
		var errorDir=_this.basedir + '/node_modules/zunkernel/templates/error.html';
		var result={codeError:'',typeError:'',stack:error.stack};
		switch (error.statusCode) {
			case 404:{
				result.codeError=error.statusCode;
				result.typeError='Page not found.'
			}break;
			case 403:{
				result.codeError=error.statusCode;
				result.typeError='Not Authorizate.'
			}break;
			case 405:{
				result.codeError=error.statusCode;
				result.typeError='Not Authorizate, invalid token CSRF'
			}break;
			case 500:{
				result.codeError=error.statusCode;
				result.typeError='Internal server error.'
			}break;
			default:{
				result.codeError=500;
				result.typeError='Internal server error.';
			}break;
		}
		var template=_this.renderFile(errorDir,result);
		res.send(template);
	}

	this.useTemplateEngine=function(fn){
		_this.useCustom.template=fn;
	}

	this.useDatabase=function(fn){
		_this.useCustom.db=fn;
	}

	this.useExpress=function(fn){
		_this.useCustom.express=fn;
	}

	this.handleError=function(fn) {
		_this.useCustom.handleError=fn
	}
	//Funcion que evalua si existen variables en las configuraciones del bundle
	function evaluateObject(object) {
		for (var i in object) {
			if (typeof (object[i]) == "string" && /^%%.+%%$/ig.test(object[i])) {
				/^%%(.+)%%$/ig.exec(object[i])
				eval('object[i]=' + RegExp.$1);
			} else if (typeof (object[i]) == "object") evaluateObject(object[i])
		}
		return object;
	}

	this.loadModel = function (bundle, filename, sequelize_db) {

		var driver = zun.config.database.driver;
		var basedir = zun.basedir.replace(/\\/ig, '/');
		var modelDir = basedir + "/bundles/" + bundle + "/model/" + filename;
		if (driver == 'sequelize') {
			sequelize_db = (sequelize_db) ? sequelize_db : zun.db;
			return require(modelDir)(zun.db, zun.sequelize);
		}
		if (driver == 'mongoose') {
			return require(modelDir)();
		}
	}

	//Funcion que carga los modelos de cada bundle y se los asigna a la variable model del bundle.
	function loadModelByBundle() {
		//Verifico que exista la variable bundle en el config
		if (!_this.config.bundles)
			return console.log('\033[31m', 'Error to load bundles. Var bundles do not exist in the config file.\n' + _this.basedir + "/config/config.js", '\x1b[0m');
		for (var i in _this.config.bundles) {
			var modelDir = zun.basedir + "/bundles/" + _this.config.bundles[i].name + "/model/";
			try {
				var listFiles = fs.readdirSync(modelDir);
				for (var j in listFiles) {
					var model_name = listFiles[j].replace(/\.js$/, "");
					zun.model[model_name] = _this.loadModel(_this.config.bundles[i].name, model_name);
				}
			} catch (error) {
				console.log('Error!!! load model. ' + error.message);
			}
		}
	}

	this.folderSystem=function() {
		var fileConfig = _this.basedir + '/config.json';
		if (!fs.existsSync(fileConfig)) {
			var dataConfig = {
				"webserver": {
					"http": {
						"port": 80,
						"redirect_https": false
					},
					"https": {
						"port": 443,
						"key": "sslcert/server.key",
						"crt": "sslcert/server.crt"
					},
					"session": {
						"store": "",
						"options": {
							"host": "",
							"port": ""
						},
						"secret": "zunkernel*2018",
						"resave": false,
						"saveUninitialized": true,
						"cookie": {
							"path": "/",
							"httpOnly": true,
							"secure": false,
							"maxAge": null
						}
					},
					"jsonwebtoken":{
						"secret": "zunkernel*2018",
						"expires":1440,
						"algorithm":"HS256",
						"header_http_name":"jwt_token",
						"body_name":"jwt_token",
						"get_query_name":"jwt_token"
					},
					"csrf":{
						"token_name":"zunframework_csrf_token",
						"secret": "csrf_zunkernel*2018",
						"expires": 1440
					}
				},
				"bundles": [],
				"database": {
					"name": "zun",
					"username": "root",
					"password": "root",
					"driver": "none",
				},
				"email": {
					"service": "Gmail",
					"auth": {
						"user": "username",
						"pass": "password"
					}
				}

			}
			fs.writeFileSync(_this.basedir + "/config.json", JSON.stringify(dataConfig, null, "\t"));

		}
		_this.config=JSON.parse(fs.readFileSync(_this.basedir + '/config.json', "utf-8"));
		var dirWWW = _this.basedir + '/www/'
		if (!fs.existsSync(dirWWW))
			fs.mkdirSync(dirWWW);
		
		var dirLog = _this.basedir + '/logs/'
		if (!fs.existsSync(dirLog))
			fs.mkdirSync(dirLog);

		var dirBundles = _this.basedir + '/bundles/'
		if (!fs.existsSync(dirBundles)) {
			fs.mkdirSync(dirBundles);
		}
		
		var zunCmd = _this.basedir + '/zun.cmd';
		if (!fs.existsSync(zunCmd)) {
			try {
				fs.writeFileSync(zunCmd, fs.readFileSync(_this.basedir + '/node_modules/zunkernel/zun.cmd'));
			} catch (e) {
				console.log('\x1b[41m', "Error copy file zun.cmd", '\x1b[0m');
			}
		}
		var zunLinux = _this.basedir + '/zun';
		if (!fs.existsSync(zunLinux)) {
			try {
				fs.writeFileSync(zunLinux, fs.readFileSync(_this.basedir + '/node_modules/zunkernel/zun'));
			} catch (e) {
				console.log('\x1b[41m', "Error copy file zun linux", '\x1b[0m');
			}
		}

		var dirSslCert = _this.basedir + '/sslcert/'
		if (!fs.existsSync(dirSslCert))
			fs.mkdirSync(dirSslCert);

		var crt = _this.basedir + '/sslcert/server.crt';
		if (!fs.existsSync(crt)) {
			try {
				fs.writeFileSync(crt, fs.readFileSync(_this.basedir + '/node_modules/zunkernel/server.crt'));
			} catch (e) {
				console.log('\x1b[41m', "Error copy file 'server.crt' linux", '\x1b[0m');
			}
		}

		var crt = _this.basedir + '/sslcert/server.key';
		if (!fs.existsSync(crt)) {
			try {
				fs.writeFileSync(crt, fs.readFileSync(_this.basedir + '/node_modules/zunkernel/server.key'));
			} catch (e) {
				console.log('\x1b[41m', "Error copy file 'server.key' linux", '\x1b[0m');
			}
		}

	}


	//Ejecuta los comandos de consola
	this.execCommand = function (cmd) {
		_this.Command.execute(cmd);
	}



	//Emite un evento para toda las aplicaciones ideal para comunicar bundles
	this.emit = function (event, data, fn) {
		data = (data) ? data : null;
		var result = false;
		for (i in _this.listeners) {
			if (event == _this.listeners[i].event)
				result = _this.listeners[i].fn(data, fn);
		}
		return result;
	}
	//Recibe un evento emitido, ideal para comunicar modulos
	this.on = function (event, fnCallback) {
		_this.listeners.push({ event: event, fn: fnCallback });
	}
	//Te dice si existe algun evento del tipo pasado por parametro dentro de la lista de escuchas
	this.existListeners = function (event) {
		for (i in _this.listeners) {
			if (event == _this.listeners[i].event)
				return true;
		}
		return false;
	}

	//Escribe en un archivo log en la carpeta log. Ideal para revizar cualquier fallo del framework
	//Si le pasas el parametro file crea un archivo con ese nombre
	this.log = function (msg, filename, fnCallback) {
		var date = new Date();
		filename = date.getFullYear() + '_' + (date.getMonth() + 1) + '_' + ((filename) ? filename : "log.txt");
		filename = "logs/" + filename;
		msg = "[" + date.toString() + "--" + msg + "]\n";
		fs.appendFile(filename, msg, function (error) {
			if (fnCallback)
				fnCallback(error);
		});
	}

	this.initUpload = function (path, name, options) {
		var multer = require('multer');
		options = (options) ? options : {}
		var storage = multer.diskStorage({
			destination: function (req, file, fnCallback) {
				var uploadPath = path;
				if (!fs.existsSync(uploadPath)) {
					return fnCallback('Error path upload file.', null);
				}
				fnCallback(null, uploadPath);
			},
			filename: function (req, file, fnCallback) {
				var ext = file.originalname.split('.');
				var filename = name;
				var extension = ext[ext.length - 1].toLowerCase();
				filename = filename + '.' + extension;
				fnCallback(null, filename);
			}
		});
		options.storage = storage
		return multer(options).single('file');
	}

	this.console = function (value, type) {
		type = (type) ? type : 'success';
		switch (type) {
			case 'success': { console.log('\x1b[32m', value, '\x1b[0m'); } break;
			case 'error': { console.log('\x1b[31m', value, '\x1b[0m'); } break;
			case 'warning': { console.log('\x1b[33m', value, '\x1b[0m'); } break;
		}
	}

	zun.encrypt = function (text) {
		var cipher = crypto.createCipher('aes-256-cbc', 'zunframework*2018')
		var crypted = cipher.update(text, 'utf8', 'hex')
		crypted += cipher.final('hex');
		return crypted;
	}

	zun.decrypt = function (text) {
		var decipher = crypto.createDecipher('aes-256-cbc', 'zunframework*2018')
		var dec = decipher.update(text, 'hex', 'utf8')
		dec += decipher.final('utf8');
		return dec;
	}

	
	

}