# **ZUNFRAMEWORK**
# Framework MVC with express, sequelize or mongoose, nodemailer and swig

## Installation

```
npm install zunkernel
```
## Quick start
### Execute this command at the root of the proyect
```
zun start
```
### If you put in the web browser http://localhost/myapp you will see the result. The framework creates an application in 0 to start.

## System files and folders:
```
-config.json (Storage the framework general configurations, such as listen port and registered bundles)
-logs (Registers system logs as of the differents bundles)
-www (Public files of the differents bundles)
-bundles(Here be created the application components)
    -bundle_name    
        -config(Bundle configurations are stored)        
            -config.json(Here the specific variables of the bundle are added in addition to the route of the routing)            
            -routing.json (General routing of the bundle)           
        -controller (Here it's go the controllers of the application)        
        -model (The models)        
        -public (It save the public files of the project such as css, js, etc...)        
        -view (Here are the bundle's html views)
```
## Features
### Zunframework config.json file.
```
{
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
            "post_body_name":"jwt_token",
            "get_query_name":"jwt_token"
        }
    },
    "bundles": [
		{
			"name": "myapp",
			"router": "/myapp",
			"main": "controller/main.js"
		}
	],
    "database": {
        "name": "zun",
        "username": "root",
        "password": "root",
        "driver": "sequelize",
        "options": {
            "dialect": "mysql",
            "host": "localhost",
            "port": 3306,
            "define": {
                "timestamps": false
            },
            "logging": false
        }
    },
    "email": {
        "service": "Gmail",
        "auth": {
            "user": "username",
            "pass": "password"
        }
    }
}
```

#### Explanation
* webserver.http.port: Port of listening by http
* webserver.http.redirect_https: Boolean variable that specifies whether to
* webserver.https.port: Port of listening by https
* webserver.session.key: Path that says where to load the server.key from https. Relative path of the project root
* webserver.session: Defines the type of session handler, if empty it uses the default memory handler of the express-session module. See [Supported session managers](#supported-session-managers)
* webserver.jsonwebtoken: Session manager by the jsonwebtoken standard.
* webserver.jsonwebtoken.secret: Secret key to encrypt by the specified algorithm
* webserver.jsonwebtoken.expires: Token expiration time in minutes
* webserver.jsonwebtoken.algorithm:Algorithm used to encrypt the token.. See https://www.npmjs.com/package/jsonwebtoken#algorithms-supported
* webserver.jsonwebtoken.header_http_name: Value of the header in case of sending the token by the http header
* webserver.jsonwebtoken.post_body_name: Name of the field sent in the body of the post request in case of sending the token by post
* webserver.jsonwebtoken.get_query_name: Value of the query in the request by get
* bundles: In this variable, the active bundles are registered in the framework
* bundles.name: Bundle name, all in lowercase and a single word without strange characters
* bundles.router: Main bundle route.
* bundles.main: Main file of the bundle, where you can load the general configurations of the bundle, create custom commands etc ... It is the first file that is loaded from the whole bundle.
* database:Configuration of access to the database. See [Database driver](#database-driver)
* email: Mail delivery configuration. See [Send mail](#send-mail)

### Global framework variables.
* zun.express (Give access to express module after run application. To use look the module express's docs http://expressjs.com/es/api.html)
* zun.basedir (Absolute path to the project root)
* zun.swig //Access to the swig template engine( See docs http://node-swig.github.io/swig-templates/docs/)
* zun.config (Object to storage the global configuration variables's of the framework)
* zun.mongoose (In case of using the mongodb driver, this object saves the initialization of the mongoose object: require ('mongoose'); For more information read: https://mongoosejs.com/docs/)
* zun.sequelize (In case of using the sequelize driver, this object saves the initialization of the sequelize object: require ('sequelize'); For more information read: http://docs.sequelizejs.com/en/latest/docs/getting-started/)
* zun.db (Object with the configured database. See below how to set up your own database)
* zun.model.model_name (Access to the created model with sequelize or mongoose. Are models of type sequelize or mongoose. To use, look Sequelize module's docs, in the models topic. Example:zequelize: zun.model.User.findAll(), mongoose:zun.model.user.find({}, function (error, data) {}))
* zun.sendEmail (Object of type createTransport of the nodemailer module. Uses the configuration of the "config.json" file of the bundle. To use, look the nodemailer module configuration:https://nodemailer.com/about/)



### When you create a bundle, automatically be create global configuration variables's of the application and you can call it from any part of it:
* zun.bundle_name.config (Give you access to the configuration file of your bundle, you can call it as an object)
* zun.bundle_name.render (Object SWIG configuring directly with folder view of the bundle)

### Framework global functions
* zun.log (message[,filename,fnCallback]) //Generate a log in the  log folder with the date and the given message
* zun.execCommand(arrayParams) //Execute framework's command. Example create bundle zun.execCommand(['create-bundle','-b','bundle_name'])
* zun.on(event_name,fnCallback) //Allow listen some event emitted by the framework
* zun.emit(event_name,data) //Allow emit a framework's event
* zun.console(value[,type])//Allows display by command console. The type parameter can take several values 'success' (default), 'error', 'warning'.
* zun.encrypt(text) //Encrypt a text string with the aes-256 algorithm
* zun.dencrypt(text) //Decrypt a text string with the aes-256 algorithm
* zun.existBundle(bundle_name) //Return true or false if exist bundle.
* zun.render(template,data)//Funcion for rendering template, use the framework template swig or the one that is configured by  useTemplateEngine. 
* useTemplateEngine (Configure a custom template engine. See [Custom Template Engine](#Custom-Template-Engine).)
* useDatabase (Configure a custom database access. See [Custom Database](#Custom-Database).)
* useExpress (Configure a custom object express. See [Custom Express](#Custom-Express).)
* initUpload(path, filename, options)//Allow you to uplaod files to the server. See examples

## Commands
* zun --version (Framework version)
* zun asset -b bundle_name (Copy data of public folder of the specified bundle to the www folder)
* zun asset -b bundle_name -r (Copy data of www folder of the specified bundle to the public folder of that bundle)
* zun create-bundle -b bundle_name (Create a bundle with the folder system inside)
* zun drop-bundle -b bundle_name (Remove a bundle)
* zun install bundle_name (Register the bundle in the framework and copy data of public folder to www folder)
* zun sync-model -b bundle_name -m model_name -f(Synchronize the models in the bundle models folder with the specified database in the config file. The "-m" parameter is optional, it is for the case that you only want to update a specific model. If you miss "-f" then force the synchronization. Only for the sequelize handler)
* zun drop-model -b bundle_name -m model_name(Remove the database tables with the existing models in the bundle's model folder. Only for the sequelize handler)
* zun create-model(It allows generating models for both sequelize and mongoose)
* map-model -b bundle_name (Maps the structure of a database to models, within the specified bundle. To execute eset command you need to install the "sequelize-auto" module)
* zun restapi -b bundle_name -m model_name -auth method_authenticate(It generates an api rest, creating the necessary routing,  controllers and repository. If it detects a model with the same name, it generates the queries to the database with the database manager specified in the configurations.)
* zun repository -b bundle_name -m model_name (Generates a repository-type design pattern for the indented model)

*If you just put the name of the command and enter and this command requires parameters the system automatically asks you*

### Register my own command
This should go in the main.js or main bundle file
```
var param=[
    {
        name:'-file',
        text:'File path',
        required:true
    }
]
zun.Command.registerCommand('test',param,'Description of my command',function(params,values){
    console.log(params,values);
    //Run my code here
})
```
## Database driver
### Sequelize
```
npm install --save sequelize
```
* For connection to database install one of the following modules: 
```
npm install --save pg pg-hstore
npm install --save mysql2
npm install --save sqlite3
npm install --save tedious // MSSQL
```
### MongoDB
```
npm install --save mongoose //MongoDB
```
### Database config
* File: root_project/config.json
Sequlize configuration:
```
"database": {
    "name": "db_name",
    "username": "root",
    "password": "root",
    "driver":"sequelize",
    "options":{
        "dialect":"mysql",//Differents dialect: mysql;mssql;postgres;sqlite
        "host": "localhost",
        "port": 3306,
        "define": {
            "timestamps": false
        }
    },
    "logging":false
}
```
MongoDB configuration:
```
"database": {
    "name": "zunkernel",
    "username": "",
    "password": "",
    "driver": "mongoose",
    "host": "localhost",
    "port": 27017,
    "options": {
        "useNewUrlParser": true
    }
},
```
## Define models
* The models are defined by separate files for each model in the model folder of the bundle.
### Mongoose (Revise how models are defined in mongoose)
```
module.exports = function() {    
    // Define schema and user model.
    var UserSchema = new zun.mongoose.Schema({
        username: {type: String, required: [true, 'Username is required.']},
        password: {type: String, select: false, required: [true, 'Password is required.']},
        email: {type: String, required: [true, 'Email is required.']},
        phone: {type: String, required: [true, 'Phone is required.']},
        firstName: {type: String, required: [true, 'First name is required.']},
        state:String
    });
    return zun.db.model('user', UserSchema);
}
```
### Sequelize (Revise how models are defined in sequelize)

```
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
	username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    salt: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: zun.sequelize.UUIDV1
    },
  }, {
    tableName: 'user'
  });
};
```
### Map models from the database(only for sequelize handler)
* Install sequelize-auto module
```
npm install --save sequelize-auto
```
* Configure access to the database in the project config.json file
* Execute command
```
zun map-models -b bundle_name
```
or 
```
zun map-models -b bundle_name table1,table2
```
### Use command "zun create-model" !!!
## Custom Database
If you need to customize access to another database you can do so using the useDatabase function.
You must first configure the access in the project's config.json
```
"database": {
    "name": "zunkernel",
    "username": "root",
    "password": "root",
    "driver": "mydriver",
    "host": "localhost",
    "port": 3306
}
```
Then you must configure the custom access. Example in the main.js of the default controller.
```
exports.index=index; 
zun.useDatabase(function(dbConfig){    
    const mysql = require('mysql2');
	// create the connection to database
	var connection = mysql.createConnection({
		host: dbConfig.host,
		user: dbConfig.username,
		database: dbConfig.name,
		password:dbConfig.password
	});
	return connection;
})

function index(req,res){
	zun.db.query('SELECT * FROM user',function(err, results, fields) {
		console.log(results); // results contains rows returned by server
		console.log(fields); // fields contains extra meta data about results, if available
		res.send(results);
	});
}
```
## Custom Template Engine
By default, use swig-templates as the template engine.
To use a new template engine you must install the module with npm. Example with handlebars.
Exmaple: I put these lines in the main.js controller created by default
```
var handlebars=require('handlebars');
zun.useTemplateEngine(function(template,data){    
    var template = handlebars.compile(template);
    return template(data);
})

function index(req,res){
	res.send(zun.myapp.render('index.html',{name:'myapp'}));
}
```

## Custom Express
It allows to configure in a personalized way the use of express in the framework.
Exmaple: I put these lines in the main.js controller created by default
```
exports.index=index; 
zun.useExpress(function(webserverConfig){ 
	var cookieParser = require('cookie-parser');
	//Modulo para el trabajo con sesiones de express
	var session = require('express-session');
	var bodyParser = require('body-parser');   
    zun.express.use(cookieParser());
	zun.express.use(session({
		resave: webserverConfig.session_handle.resave,
		saveUninitialized: webserverConfig.session_handle.saveUninitialized,
		secret:webserverConfig.session_handle.secret,
		cookie:webserverConfig.session_handle.cookie
	}));
	zun.express.use(bodyParser.json());
	zun.express.use(bodyParser.urlencoded({extended: true}));
})

function index(req,res){
	res.send('ok')
}
```


## Events
* routing: Event issued by the framework when accessing a route.See examples.
* db_connect: Event that is executed when the connection with the database is established. See examples

## Routing config by bundle
### Example:
File: zunframework/bundle/bundle_name/config/routing.json
```
[{
    "url": "/login", //Route to execute
    "method": "get", //HTTP method of the call, compatible with all methods that you have in the express module(get, post, put, delete, etc...)
    "controller":"user",//File name in the controller folder
    "fn": "User.create",//The function to execute in that file. This function should be exported to be used
    "authenticated":"",//If you want to specify that for this route the user is authenticated, the accepted values are "session" or "jsonwebtoken"
    "roles":['admin','client'] //You can specify roles by route to restrict the access to those routes. To a good performance of this procedure you must specify in the express session a variable named role with the role name. Example req.session.role = 'admin' and restrict the routes by role
}]
```

## Authenticate users
**The framework provides the way to authenticate users and take charge of validating the routes to which they have access or not.**
### Authenticating with session
* We create an authentication path for example / login in the routing.json
```
{
    "url": "/",
    "method": "post",
    "controller": "main",
    "fn": "index"
}
```
* In the controller we authenticate against the database and pass the data to zunAuthenticate
```
function login(req,res){
	zun.model.user.findOne({where:{username:req.body.username}})
	.then(function(data){
		if(data && data.password===req.body.password){
			req.zunAuthenticate({id:data.id,type:'session',roles:data.role});
            //My custom session data
            req.session.mydata=data
			res.json({success:true})
		}else res.json({success:false})
	})
	.catch(function(){
		res.json({success:false})
	})
	
}
```
* Then you can retrieve the session data with req.session.zunsession. Example:
```
function mycontroller(req,res){
    res.send(req.session.zunsession)
}
```
* To close the session use req.zunLogout (). Example:
```
exports.logout=function (req,res){
	req.zunLogout();
	res.json({msg:"Logout success"});
}
```
**Explanation:**
The framework generates the req.zunAuthenticated function that only 3 parameters are passed to it. The identifier of the session, the type of authentication and the roles for this session (this value is optional). The framework is in charge every time you access a route that carries authentication (in the routing specified with "authenticated") validate whether you have access or not.
### Authenticating with jsonwebtoken
* We create an authentication path for example / login in the routing.json
```
{
    "url": "/",
    "method": "post",
    "controller": "main",
    "fn": "index"
}
```
* In the controller we authenticate against the database and pass the data to zunAuthenticate
```
function login(req,res){
	zun.model.user.findOne({where:{username:req.body.username}})
	.then(function(data){
		if(data && data.password===req.body.password){
			var token=req.zunAuthenticate({id:data.id,type:'jsonwebtoken',roles:data.role,data:data});
			res.json({success:true,token:token})
		}else res.json({success:false})
	})
	.catch(function(){
		res.json({success:false})
	})
	
}
```
* Then you can retrieve the session data with req.session.zunsession. Example:
```
function mycontroller(req,res){
    res.send(req.session.zunsession)
}
```
**Explanation:**
The framework generates the req.zunAuthenticated function that only 3 parameters are passed to it. The identifier of the session, the type of authentication and the roles for this session (this value is optional). The framework is in charge every time you access a route that carries authentication (in the routing specified with "authenticated") validate whether you have access or not.
## Configure Express
In the config.json file of the project root you must configure:
```
"webserver": {
	"http":{
		"port":80,
		"redirect_https":false//When it is variable it is true it redirects all the http requests to https
	},
	"https": {
		"port": 443,//Https port
		"key": "sslcert/server.key",//Path of the file with the key of the ssl certificate
		"crt": "sslcert/server.crt"//Path of the file with the ssl certificate
	},
	"session_handle":{//Express session manager
		"store":"connect-mongo",//Different configurable session managers
		"options":{//Options for the configured manager
			"url":"mongodb://localhost/zunkernel"
		},
		"secret": "zunkernel*2018",
		"resave":false,
		"saveUninitialized":true,
		"cookie":{ 
			"path": "/", 
			"httpOnly": true, 
			"secure": false, 
			"maxAge": null 
		}
	}
},
```
### Supported session managers
Review the official documentation of the express session manager:https://www.npmjs.com/package/express-session
#### Redis
Install module:
```
npm install connect-redis
```
Example
```
"session_handle":{
	"store":"connect-redis",
	"options":{
		"host":"127.0.0.1",
		"port":"6379"
	},
	"secret": "zunkernel*2018",
	"resave":false,
	"saveUninitialized":true,
	"cookie":{ 
		"path": "/", 
		"httpOnly": true, 
		"secure": false, 
		"maxAge": null 
	}
}
```
#### Sequelize
Install module:
```
npm install connect-session-sequelize
```
Funcional para mysql,postgres,sqlserver y sqlite, usando el objeto sequelize configurado en la base de datos
```
"session_handle":{
	"store":"connect-session-sequelize",
	"options":{},
	"secret": "zunkernel*2018",
	"resave":false,
	"saveUninitialized":true,
	"cookie":{ 
		"path": "/", 
		"httpOnly": true, 
		"secure": false, 
		"maxAge": null 
	}
}
```

#### MongoDb
Install module:
```
npm install connect-mongo
```
Exmaple
```
"session_handle":{
	"store":"connect-mongo",
	"options":{
		"url":"mongodb://localhost/zunkernel"
	},
	"secret": "zunkernel*2018",
	"resave":false,
	"saveUninitialized":true,
	"cookie":{ 
		"path": "/", 
		"httpOnly": true, 
		"secure": false, 
		"maxAge": null 
	}
}
```
## Send mail
* Install nodemailer module
```
npm install --save nodemailer
```
* Configure mail in the config.js
```
"email": {
    "service": "Gmail",
    "auth": {
        "user": "username",
        "pass": "password"
    }
}
```
**Review the configurations passed to the createTransport object in the nodemailer library
### Example of sending mail 
```
var mailOptions = {
    from: 'mymail@gmail.com', // sender address   
    to: 'othermail@gmail.com', // list of receivers    
    subject: 'Hello', // Subject line    
    text: 'Hello world ?', // plain text body    
    html: 'Hello world ?' // html body    
};
zun.sendMail(mailOptions)
.then(function(){
	zun.console('Mail sent correctly.')
})
.catch(function(){
	zun.console('Error when sending mail','error')
})

```
## Examples

### Querying the database 
* Sequelize
```
zun.model.user.findAll(options)
.then(function(data){
    console.log(data)
})
.catch(function(error){
    console.log(error)
})
```
//Querying the database with the user.js model
** For more information revizar: http://docs.sequelizejs.com/manual/tutorial/querying.html
* Mongoose
```
zun.model.user.find({}, function (error, data) {
    if (error) 
        return console.log(error.message)
    else console.log(data);            
})
```
### Render html

zun.bundle_name.render('login.html',{data:"test"}) //Render the html in the login.html file of the package view folder, passing it the data variable.

proyect/bundles/myapp/view/login.html
```html
<div>{{data}}</div>
```
### Events
* Routing
```
zun.on('routing', function (data, next) {
    /*Object data:{
        roles:"Roles of the route",
        url:"Route",
        method:"Method use, post, get , delete etc..",
        bundle:"Bundle name",
        controller:"Controller directory of routing",
        fn:"Function to execute on the controller",
        req:"Object request express",
        res:"Object response express"
        }
    */
    if(!data.req.session.user)
        return data.res.status(405).send('Not authorized.');
    next();//Function that allows the call to that route to continue running
})
```
* DB Conecction
```
zun.on('db_connect', function (error) {
	if(error)
		return zun.console("Failed connection.",'error')
	zun.console('Success connection!');
});
```
### Upload File
You must install the module "multer"
```
npm install multer
```
#### In a controller
```
exports.uploadFile=function(request,response){
    var uploadFilename=Date.now();
    var uploadPath=zun.basedir+'/www/admin/upload/';
    var upload=zun.initUpload(uploadPath,uploadFilename,{limits:{fileSize:512000000000}});
    upload(req, res, function (err,filename) {
        if (err) {
            return res.status(500).send('Error load file:'+JSON.stringify(err));      
        }
        res.send(req.file.filename);
    })
}
```