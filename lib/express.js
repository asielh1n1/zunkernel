var express=require('express');
//Modulo para el trabajo con cookies de express
var cookieParser = require('cookie-parser');
//Modulo para el trabajo con sesiones de express
var session = require('express-session');
var bodyParser = require('body-parser');
var https = require('https');
var fs = require('fs');

exports.ExpressHandler=function(){
    
    //COnfiguracion del framework express
	function configExpress(){
		zun.express=express();
		zun.express.use('/www', express.static(zun.basedir+"/www"));	
			
		if(zun.useCustom.express){
			zun.useCustom.express(zun.config.webserver);
		}else{
			zun.express.use(cookieParser());
			var store=handleSession();
			zun.express.use(session({
				resave: zun.config.webserver.session.resave,
				saveUninitialized: zun.config.webserver.session.saveUninitialized,
				secret:zun.config.webserver.session.secret,
				cookie:zun.config.webserver.session.cookie,
				store:store
			}));
			zun.express.use(bodyParser.json());
			zun.express.use(bodyParser.urlencoded({extended: true}));			
		}
		
	}


	function handleSession(){
		var storeType=zun.config.webserver.session.store;
		switch (storeType) {
			case 'connect-redis':{
				try {
					var RedisStore = require('connect-redis')(session);
					var redis = require("redis");
    				var client = redis.createClient();
					var myStore=new RedisStore({
						client:client,
						host:(zun.config.webserver.session.options.host)?zun.config.webserver.session.options.host:'',
						port:(zun.config.webserver.session.options.port)?zun.config.webserver.session.options.port:''
					});
					return myStore;
				} catch (error) {
					zun.console('Error to configure handle session, module "redis" or "connect-redis" not exist.','error');
					return null;		
				}
			}break;
			case 'connect-session-sequelize':{
				try {
					var SequelizeStore = require('connect-session-sequelize')(session.Store);
					var myStore= new SequelizeStore({
						db: zun.db
					});
					myStore.sync();
					return myStore;
				} catch (error) {
					zun.console('Error to configure handle session, module "connect-session-sequelize" not exist.','error');
					return null;		
				}
			}break;
            case 'connect-mongo':{
				try {
					const MongoStore = require('connect-mongo')(session);
                    var options={}
                    if(zun.config.webserver.session.options.url)
                        options.url=zun.config.webserver.session.options.url
					var myStore=new MongoStore(options);
					return myStore;
				} catch (error) {
                    console.log('Error:',error);                    
					zun.console('Error to configure handle session, module "connect-mongo" not exist.','error');
					return null;		
				}
			}break;
			default:{
				return null;
			}
		}
	}

    this.initWebServer=function(){
		configExpress();
		if(zun.config.webserver.http.redirect_https){
			zun.express.use(function(req, res,next){
				if(!req.secure){
					res.redirect("https://" + req.headers.host + req.url);
				}else{
					next();
				}
			});
		}
		zun.express.listen(zun.config.webserver.http.port,function (){
			console.log('\x1b[32m','- Server listen http port: '+zun.config.webserver.http.port,'\x1b[0m');
			zun.log("Server initialized...","system.txt");
		});		
		var privateKey  = fs.readFileSync(zun.basedir+'/'+zun.config.webserver.https.key, 'utf8').toString();
		var certificate = fs.readFileSync(zun.basedir+'/'+zun.config.webserver.https.crt, 'utf8').toString();
		var credentials = {key: privateKey, cert: certificate};
		var httpsServer = https.createServer(credentials, zun.express);		
		httpsServer.listen(zun.config.webserver.https.port,function (){
			console.log('\x1b[32m','- Server listen https port: '+zun.config.webserver.https.port,'\x1b[0m');
			zun.log("Server initialized...","system.txt");
		});
	}

}