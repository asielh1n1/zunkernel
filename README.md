
#Framework MVC with express, sequelize or mongoose, nodemailer and swig

## Installation

```
npm install zunkernel
```
##Quick start

```
var ZunKernel = require('zunkernel').ZunKernel;
zun = new ZunKernel();
```
###Run the script in a command line and you already have a web application listening for port 80. If you put in the web browser http://localhost/testapp you will see the result.
## For connection to database install one of the following modules:
```
$ npm install --save pg pg-hstore
$ npm install --save mysql2
$ npm install --save sqlite3
$ npm install --save tedious // MSSQL
$ npm install --save mongoose //MongoDB

```
## System files and folders:
```
-config.json (Storage the framework general configurations, such as listen port and registered bundles)
-logs (Registers system logs as of the differents bundles)
-www (Public files of the differents bundles)
-bundles(Here be created the application components)
    -bundle_name    
        -config(Here it's saved bundle configurations)        
            -config.json            
            -routing.json            
        -controller (Here it's go the controllers of the application)        
        -model (The models)        
        -public (It save the public files of the project such as css, js, etc...)        
        -view (Here are the bundle's html views)
```
##Features

###Global framework variables.
* zun.express (Give access to express module after run application. To use look the module express's docs http://expressjs.com/es/api.html)
* zun.basedir (Absolute path to the project root)
* zun.swig //Access to the swig template engine( See docs http://node-swig.github.io/swig-templates/docs/)
* zun.config (Object to storage the global configuration variables's of the framework)
* zun.mongoose (In case of using the mongodb driver, this object saves the initialization of the mongoose object: require ('mongoose'); For more information read: https://www.npmjs.com/package/mongoose)

###When you create a bundle, automatically be create global configuration variables's of the application and you can call it from any part of it:
* zun.bundle_name.config (Give you access to the configuration file of your bundle, you can call it as an object)
* zun.bundle_name.db (Object of database access and it's a Sequelize object with the file configurations of "config.json" of your bundle. To use, look Sequelize module's docs)
* zun.bundle_name.render (Object SWIG configuring directly with folder view of the bundle)
* zun.bundle_name.model.model_name (Access to the created model with sequelize. Are models of type sequelize. To use, look Sequelize module's docs, in the models topic. Example: zun.test.model.User.findAll())
* zun.bundle_name.email (Object of type createTransport of the nodemailer module. Uses the configuration of the "config.json" file of the bundle. To use, look the nodemailer module configuration)

###Framework global functions
* zun.log (message[,filename,fnCallback]) //Generate a log in the  log folder with the date and the given message
* zun.execCommand(arrayParams) //Execute framework's command. Example create bundle zun.execCommand(['bundle:create','bundle_name'])
* zun.on(event_name,fnCallback) //Allow listen some event emitted by the framework
* zun.emit(event_name,data) //Allow emit a framework's event
* zun.console(value[,type])//Allows display by command console. The type parameter can take several values success (default), error, warning.
* zun.encrypt(text) //Encrypt a text string with the aes-256 algorithm
* zun.dencrypt(text) //Decrypt a text string with the aes-256 algorithm

##Commands

* zun -v (Framework version)
* zun bundle:asset -a (Copy data of public folder of all bundles to the www folder)
* zun bundle:asset bundle_name (Copy data of public folder of the specified bundle to the www folder)
* zun bundle:asset bundle_name -r (Copy data of www folder of the specified bundle to the public folder of that bundle)
* zun bundle:create bundle_name (Create a bundle with the folder system inside)
* zun bundle:install bundle_name (Register the bundle in the framework and copy data of public folder to www folder)
* zun bundle:model:sync bundle_name (Synchronize the models in the bundle models folder with the specified database in the config file of that bundle. Update the tables. Only for the sequelize handler)
* zun bundle:model:sync-force bundle_name (Synchronize the models in the bundle models folder with the specified database in the config file of that bundle. Remove and recreate the tables. Only for the sequelize handler)
* zun bundle:model:map bundle_name (Map the  tables in the specified database in the bundle config and convert to models in the model folder. Only for the sequelize handler)
* zun bundle:model:drop bundle_name (Remove the database tables with the existing models in the bundle's model folder. Only for the sequelize handler)
* zun bundle:command bundle_name file_name_dir:function_execute param1 param2 param_etc (Execute a function in the file with the specified direction in the console and the name of that function. The executed function receive the params like an array of params)
##Events
* routing:Event issued by the framework when accessing a route.See examples.
* db_connect: Event that is executed when the connection with the database is established. Only for the mongodb handler. See examples

##Define models
* The models are defined by separate files for each model in the model folder of the bundle.
* When the handler is mongodb (Revise how models are defined in mongoose)
```
module.exports = function() {    
    // Define schema and user model.
    var UserSchema = new zun.mongoose.Schema({
        username: {type: String, required: [true, 'Username is required.'], unique: [true, 'Username already exists.']},
        password: {type: String, select: false, required: [true, 'Password is required.']},
        email: {type: String, required: [true, 'Email is required.']},
        phone: {type: String, required: [true, 'Phone is required.']},
        firstName: {type: String, required: [true, 'First name is required.']},
        state:String
    });
    return zun.bundle_name.db.model('user', UserSchema);
}
```
* When the handler is sequelize (Revise how models are defined in sequelize)

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
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'user'
  });
};
```
###Map models from the database(only for sequelize handler)
* Install sequelize-auto module
```
npm install --save sequelize-auto
```
* Configure access to the database for that bundle in the project / bundles / config / config.json file
* Execute command
```
zun bundle:model:map bundle_name
```
##Routing config by bundle
###Example:
File:zunframework/bundle/bundle_name/config/routing.json
```
[{
    "url": "/login", //Route to execute
    "method": "get", //HTTP method of the call, compatible with all methods that you have in the express module(get, post, put, delete, etc...)
    "path": "main:index", //First go the file name in the controller folder and after of colon the function to execute in that file. This function should be exported to be used
    "roles":['admin','client'] //You can specify roles by route to restrict the access to those routes. To a good performance of this procedure you must specify in the express session a variable named role with the role name. Example req.session.role = 'admin' and restrict the routes by role
}]
```

##Database config
###Example:
File:zunframework/bundle/bundle_name/config/config.json
```
"database": {
    "name": "databse_name", //Database name
    "host": "127.0.0.1",//Database server
    "port": "",//Database port
    "username": "user",//Database user
    "password": "pass",//Database password
    "driver": "sequelize:none"//Connection driver. Differents drivers: sequelize:mysql;sequelize:mssql;sequelize:postgres;sequelize:sqlite
}
```
It is also possible to use references to other bundle or system variables with the following format %% zun.other_bundle.config.database.host %%. Example
```
"database": {
    "name": "databse_name",
    "host": "%%zun.other_bundle.config.database.host%%",
    "port": 1433,
    "username": "%%zun.other_bundle.config.database.username%%",
    "password": "%%zun.other_bundle.config.database.password%%",
    "driver": "sequelize:mssql"
}
```
**The order in which the bundles are loaded are important here
##Configure https
In the config.json file of the project root you must configure:
```
"webserver": {
		"http_port": 80,//Puerto por http(default)
		"disabled_https": true,//Variable that allows to enable or disable https
		"https": {
			"port": 443,//Https port
			"key": "/sslcert/apache.key",//Path of the file with the key of the ssl certificate
			"crt": "/sslcert/apache.crt"//Path of the file with the ssl certificate
		}
	},
```
Just put the certificates and put the variable disabled_https in false.
##Send mail
* Install nodemailer module
```
npm install --save nodemailer
```
* Configure mail in the config.js of the bundle:proyect/bundles/bundle_name/config/config.json
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
###Example of sending mail 
```
var mailOptions = {

    from: 'test@gmail.com', // sender address   
    to: 'test@gmail.com', // list of receivers    
    subject: 'Hello', // Subject line    
    text: 'Hello world ?', // plain text body    
    html: 'Hello world ?' // html body    
};

//Send mail with defined transport object

zun.bundle_name.email.sendMail(mailOptions,function(error,info){
    if (error)    
        return console.log(error);        
    console.log('Message %s sent: %s', info.messageId, info.response);    
})
```
##Examples

* Querying the database 

zun.bundle_name.model.user.findAll() //Querying the database with the user.js model
** For more information revizar: http://docs.sequelizejs.com/manual/tutorial/querying.html

###Render html

zun.bundle_name.render('login.html',{data:"test"}) //Render the html in the login.html file of the package view folder, passing it the data variable.

proyect/bundle/bundle_name/view/login.html
```html
<div>{{data}}</div>
```
###Events
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
    next();//Function that allows the call to that route to continue running
})
```
* DB Conecction
```
zun.on('db_connect', function (error) {
	if(Object.keys(error).length !== 0 && error.constructor !== Object)
		return zun.console("MongoDB: Failed connection.",'error')
	zun.console('MongoDB: Success connection!');
});
```