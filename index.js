//Modulos Utilizados en el framework
var fs = require('fs');
var path=require('path');
var express=require('express');
var swig = require('swig');
//Modulo para el trabajo con cookies de express
var cookieParser = require('cookie-parser');
//Modulo para el trabajo con sesiones de express
var session = require('express-session');
var bodyParser = require('body-parser');
var basedir=path.dirname(path.dirname(__dirname))
var multer = require('multer');
DataBase=new require("./lib/DataBase");
var nodemailer = require('nodemailer');
var https = require('https');
/*
 Descripcion:Clase base del Framework,es el nucleo del sistema.
 Carga las configuraciones por bundles y ademas de los routing para cada bundle

 */
exports.ZunKernel=function(){

	var _this=this;
	zun=this;
	this.listeners=new Array();

	//Ruta raiz donde esta alojado el proyecto
	this.basedir=path.dirname(path.dirname(__dirname));
	//Express framework
	this.express=null;
	//Object access database
	this.Database=DataBase;
	//Template engine
	this.swig=swig;
	//Variable que almacena las configuraciones generales
	_this.config=null;
	//Variable global del framework

	this.init=function(init_mode){
		init_mode=(init_mode)?init_mode:'production';
		switch (init_mode) {
			case 'production':
			{
				folderSystem();
				configExpress();
				loadConfigByBundle();
				loadModelByBundle();
				loadRoutingByBundles();
				//Verifico si esta habilitado https o no
				if(this.config.webserver.disabled_https){
					this.express.listen(this.config.webserver.http_port,this.config.ip_server,function (){
						zun.emit('init','Server '+_this.config.ip_server+' running!!\nListen port: '+_this.config.listen_port)
						console.log('\x1b[32m','Server running!!\nListen port: '+_this.config.webserver.http_port,'\x1b[0m');
						_this.log("Server initialized...","system.txt");
					});
				}else{
					var privateKey  = fs.readFileSync(_this.basedir+this.config.webserver.https.key, 'utf8').toString();
					var certificate = fs.readFileSync(_this.basedir+this.config.webserver.https.crt, 'utf8').toString();
					var credentials = {key: privateKey, cert: certificate};
					var httpsServer = https.createServer(credentials, this.express);
					httpsServer.listen(this.config.webserver.https.port,function (){
						zun.emit('init','Server '+_this.config.ip_server+' running https!!\nListen port: '+_this.config.webserver.https.port)
						console.log('\x1b[32m','Server running https!!\nListen port: '+_this.config.webserver.https.port,'\x1b[0m');
						_this.log("Server initialized...","system.txt");
					});
				}
				//Evento que se ejecuta cuando se cierra el proceso de node
				process.on('SIGINT',function(){
					_this.log("Server Stoped...","system.txt",function (){
						process.exit();
					})
				});
			}break;
			case 'command':
			{
				folderSystem();
				loadConfigByBundle();
				loadModelByBundle();
			}break;
			default:
			{
				console.log('\033[31m', "This mode of initialize zun framework not exist",'\x1b[0m');
			}break;
		}

	}

	//Cargo las configuraciones generales del framework
	this.loadGeneralConfig=function(){
		//Cargo las configuraciones generales del framework
		try {
			var config_dir=_this.basedir+'/config.json';
			return JSON.parse( fs.readFileSync(config_dir, "utf-8") );
		} catch (error) {
			return console.log('\033[31m', 'Error load config file.\n'+__dirname+"/config/config.js. "+error.message ,'\x1b[0m');
		}
	}
	//Carga los routing por bundles
	function loadRoutingByBundles(){
		//Verifico que exista la variable bundle en el config
		if(!_this.config.bundles)
			return console.log('\033[31m', 'Error to load bundles. Var bundles do not exist in the config file.\n'+this.basedir+"/config/config.js" ,'\x1b[0m');
		for(i in _this.config.bundles){
			try{
				var config=JSON.parse(fs.readFileSync(_this.basedir+'/bundles/'+_this.config.bundles[i].name+'/config/config.json', "utf-8"));
				//Ejecuto cada uno de los ruting de ese bundle
				for(k in config.router){
					//Cargo el archivo de routing del bundle
					var rounting=JSON.parse(fs.readFileSync(_this.basedir+'/bundles/'+_this.config.bundles[i].name+'/config/'+config.router[k], "utf-8"));
					//Se lo asigno a una variable global que se pude llamar desde cualquier parte del codigo
					for(j in rounting){
						var method=rounting[j].method.toLowerCase();
						var url=_this.config.bundles[i].router+rounting[j].url.toLowerCase();
						url=url.replace("//","/");
						var dir=rounting[j].path.split(":");
						var roles = [];
						if (rounting[j].roles) {
							roles = rounting[j].roles;
						}
						//var result='_this.express.'+method+'("'+url+'",require(_this.basedir+"/bundles/'+_this.config.bundles[i].name+'/controller/'+dir[0]+'").'+dir[1]+');';
						eval('var fn=require(_this.basedir+"/bundles/' + _this.config.bundles[i].name + '/controller/' + dir[0] + '").' + dir[1]);
						var values={
							roles:roles,
							url:url,
							method:method,
							bundle:_this.config.bundles[i].name,
							controller:dir[0],
							fn:dir[1]
						}
						var result = '_this.express.' + method + '("' + url + '",function(req,res){middleWare(req,res,' + JSON.stringify(values) + ',fn)});';
						result=result.replace("//","/");
						eval(result);
					}
				}

			}catch(e){
				console.log('\033[31m',"Error load routing zunkernel",'\x1b[0m');
				console.log('\033[31m', e,'\x1b[0m');
			}
		}
	}
	//Funcion intermedia para ejecutar los controladores dada una ruta
	function middleWare(req, res, values, fnController) {
		if (values.roles.length) {
			if(typeof(values.roles)=="string" && values.roles!=req.session.role)
				return res.status(403).send('Not authorized.');
			if (values.roles.indexOf(req.session.role)==-1)
				return res.status(403).send('Not authorized.');

		}
		if(_this.existListeners('routing')){
			values.req=req;
			values.res=res;
			zun.emit('routing',values,function(){
				eval('require(_this.basedir+"/bundles/' + values.bundle + '/controller/' + values.controller + '").' + values.fn+'(req,res)');
			})
		}else eval('require(_this.basedir+"/bundles/' + values.bundle + '/controller/' + values.controller + '").' + values.fn+'(req,res)');


	}
	//Funcion que devuelve true o false si el bundle existe o no en el framework registrado
	this.existBundle=function(name){
		for(i in _this.config.bundles){
			if(_this.config.bundles[i].name==name)
				return true;
		}
		return false;
	}

	function loadConfigByBundle(){

		//Verifico que exista la variable bundle en el config
		if(!_this.config.bundles)
			return console.log('\033[31m', 'Error to load bundles. Var bundles do not exist in the config file.\n'+_this.basedir+"/config/config.js" ,'\x1b[0m');
		for(i in _this.config.bundles){
			try{

				eval("zun."+_this.config.bundles[i].name+"={}")
				//Cargo el archivo de configuracion del bundle
				var conf_bundle=fs.readFileSync(_this.basedir+'/bundles/'+_this.config.bundles[i].name+'/config/config.json', "utf-8");
				//Se lo asigno a una variable global que se puede llamar desde cualquier parte del codigo
				//Cada nombre que se le ponga al bundle seria una variable global que se pueda utilizar
				//con las configuraciones de ese bundle.
				eval("zun."+_this.config.bundles[i].name+'.config='+conf_bundle);
				//Creo una variable bd para ese bundle para el acceso a la bd de ese bundle
				eval("zun."+_this.config.bundles[i].name+".db=new DataBase(zun."+_this.config.bundles[i].name+".config.database)");
				eval("zun."+_this.config.bundles[i].name+".email=nodemailer.createTransport(zun."+_this.config.bundles[i].name+".config.email)");
				//Creo una variable render para ese bundle para el motor de plantilla de ese bundle
				eval("zun."+_this.config.bundles[i].name+".render=function(file,params){return swig.renderFile( _this.basedir+'/bundles/"+_this.config.bundles[i].name+"/view/'+file,params)}");
				/*Ejemplo:
				 * -De cualquier lugar de la app puedo decir zunkernel.bundle.db y puedo acceder a la base de datos
				 * -De cualquier lugar de la app puedo decir zunkernel.bundle.render y renderizar una vista
				 * -De cualquier lugar de la app puedo decir zunkernel.bundle.config.values y acceder a los valores de las configuraciones definidas
				 */
			}catch(e){
				console.log('\033[31m',e,'\x1b[0m');
			}
		}
	}


	function loadModelByBundle(){
		//Verifico que exista la variable bundle en el config
		if(!_this.config.bundles)
			return console.log('\033[31m', 'Error to load bundles. Var bundles do not exist in the config file.\n'+_this.basedir+"/config/config.js" ,'\x1b[0m');
		for(i in _this.config.bundles){
			var modelDir=zun.basedir+"/bundles/"+_this.config.bundles[i].name+"/model/";
			var model={};
			try {
				var listFiles=fs.readdirSync(modelDir);
				for(j in listFiles){
					try {
						var basedir=zun.basedir.replace(/\\/ig,'/');
						var model_name=listFiles[j].replace(".js","");
						eval('model.'+model_name+'=require("'+basedir + '/bundles/'+_this.config.bundles[i].name+'/model/'+listFiles[j]+'")(zun.'+_this.config.bundles[i].name+'.db, Sequelize);');
					} catch (error) {
						return console.log('Error!!! require model '+listFiles[j]+'. '+error.message);
					}
				}
			} catch (error) {
				console.log('Error!!! when synchronizing the database. '+error.message);
			}
			eval('zun.'+_this.config.bundles[i].name+'.model=model')
		}
	}

	function folderSystem(){
		var fileConfig=_this.basedir+'/config.json';
		if (!fs.existsSync(fileConfig)){
			var dataConfig = {
				"ip_server": "localhost",
				"webserver":{
					"http_port":80,
					"disabled_https":false,
					"https":{
						"port":443,
						"key":"server.crt",
						"crt":"server.key"
					}
				},
				"bundles": []

			}
			fs.writeFileSync(_this.basedir + "/config.json", JSON.stringify(dataConfig, null, "\t"));

		}

		var dirWWW=_this.basedir+'/www/'
		if (!fs.existsSync(dirWWW))
			fs.mkdirSync(dirWWW);
		var dirBundles=_this.basedir+'/bundles/'
		if (!fs.existsSync(dirBundles)){
			fs.mkdirSync(dirBundles);
			_this.execCommand(['bundle:create','testapp'])
		}
		var dirLog=_this.basedir+'/logs/'
		if (!fs.existsSync(dirLog))
			fs.mkdirSync(dirLog);
		var zunCmd=_this.basedir+'/zun.cmd';
		if (!fs.existsSync(zunCmd)){
			try {
				fs.writeFileSync(zunCmd, fs.readFileSync(_this.basedir+'/node_modules/zunkernel/zun.cmd'));
			} catch (e) {
				console.log('\x1b[41m',"Error copy file zun.cmd",'\x1b[0m');
			}
		}
		var zunLinux=_this.basedir+'/zun';
		if (!fs.existsSync(zunLinux)){
			try {
				fs.writeFileSync(zunLinux, fs.readFileSync(_this.basedir+'/node_modules/zunkernel/zun'));
			} catch (e) {
				console.log('\x1b[41m',"Error copy file zun linux",'\x1b[0m');
			}
		}
		//Almaceno las configuraciones generales
		_this.config=_this.loadGeneralConfig();

	}


	//Ejecuta los comandos de consola
	this.execCommand=function(command){
		var ZunCommand=require('./lib/command').ExecCommand;
		ZunCommand(command);
	}

	//COnfiguracion del framework express
	function configExpress(){
		_this.express=express();
		_this.express.use(cookieParser());
		_this.express.use(session({
			resave: true,
			saveUninitialized: true,
			secret: 'zunkernel.2017*'
		}));
		_this.express.use(bodyParser.json());
		_this.express.use(bodyParser.urlencoded({extended: true}));
		//Configura las rutas publicas del proyecto
		_this.express.use('/www', express.static(_this.basedir+"/www"));

	}

	//Emite un evento para toda las aplicaciones ideal para comunicar modulos
	this.emit=function(event,data,fn){
		data=(data)?data:{};
		for(i in _this.listeners){
			if(event==_this.listeners[i].event)
				_this.listeners[i].fn(data,fn);
		}
	}
	//Recibe un evento emitido ideal para comunicar modulos
	this.on=function(event,fnCallback){
		_this.listeners.push({event:event,fn:fnCallback});
	}
	//Te dice si existe algun evento del tipo pasado por parametro dentro de la lista de escuchas
	this.existListeners=function(event){
		for(i in _this.listeners){
			if(event==_this.listeners[i].event)
				return true;
		}
		return false;
	}

	//Escribe en un archivo log en la carpeta log. Ideal para revizar cualquier fallo del framework
	//Si le pasas el parametro file crea un archivo con ese nombre
	this.log=function(msg,filename,fnCallback){
		var date=new Date();
		filename=(filename)?"logs/"+filename:"logs/log.txt";
		msg="["+date.toString()+"--"+msg+"]\n";
		fs.appendFile(filename,msg,function(error){
			if(fnCallback)
				fnCallback(error);
		});
	}

	this.initUpload=function(){
		storage = multer.diskStorage({
			destination: function (req, file, cb) {
				var uploadPath =req.uploadPath;

				fs.existsSync(uploadPath, function (exists) {
					if (!exists) {
						fs.mkdir(uploadPath, function (err) {
							if (err) {
								console.log('Error in folder creation.');
							}
						});
					}
				});

				cb(null, uploadPath);
			},
			filename: function (req, file, cb) {
				var ext = file.originalname.split('.');
				var filename = req.uploadFilename;
				var extension=ext[ext.length - 1].toLowerCase();
				cb(null, filename + '.' + extension);
			}
		});
		this.upload = multer({storage: storage}).single('file');
	}

	this.console=function(value,type){
		type=(type)?type:'success';
		switch (type){
			case 'success':{console.log('\x1b[32m',value,'\x1b[0m');}break;
			case 'error':{console.log('\x1b[41m',value,'\x1b[0m');}break;
		}
	}

	this.initUpload();

}