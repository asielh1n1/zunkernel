var fs = require('fs');
exports.Command=Command;

function Command(){


    var readline=require('readline');
    var rl=readline.createInterface({
        input:process.stdin,
        output:process.stdout
    })

    this.listCommand=[];

    _this=this;

    this.registerCommand=function(name,paramsList,description,fnCallBack){
        if(this.exist(name))return zun.console('This command already exist.');
        this.listCommand.push({name:name,params:paramsList,description:description,fn:fnCallBack})
    }

    this.exist=function(name){
        for(var i in this.listCommand){
            if(this.listCommand[i].name===name)
                return this.listCommand[i];
        }
        return false;
    }

    this.execute=function(values){
        try {
            let commandName=values[0];
            var commandValue=_this.exist(commandName);
            if(!commandValue){
                zun.console('This command "'+commandName+'" not exist.','error');
                //throw new Error('This command not exist.');
                process.exit();
            }
            if(commandValue.params.length && values.length===1){
                answerParams(commandValue.params,{},0,function(result){
                    delete values[0];
                    values=values.filter(function(item){
                        return item
                    })
                    commandValue.fn(result,values);
                });
                return;
            }
            var valuesParams={}
            for(var i in commandValue.params){
                var index=values.indexOf(commandValue.params[i].name)
                if(index==-1){
                    if(commandValue.params[i].required){
                        zun.console('Error execute command "'+commandValue.name+'" param "'+commandValue.params[i].name+'" not found','error');                    
                        _this.help(commandValue);
                        process.exit();
                    }else continue;
                }
                if(!values[index+1]){
                    zun.console('The param '+commandValue.params[i].name+' not have value','error');
                    //throw new Error('The param '+commandValue.params[i]+' not have value');
                    process.exit();
                }                
                valuesParams[commandValue.params[i].name]=values[index+1];
                delete values[index];
                delete values[index+1];
            }
            delete values[0];
            values=values.filter(function(item){
                return item
            })
            commandValue.fn(valuesParams,values);
            
        } catch (error) {
            console.log(error);            
        }
        
    }

    function answerParams(params,result,index,fnCallBack){
        if(index>=params.length){
            fnCallBack(result);
            return;
        }
        rl.question(params[index].text+': ',function(answer){            
            if(!answer && params[index].required){
                zun.console('The param "'+params[index].name+'" is required.');
                process.exit();
            }
            result[params[index].name]=(answer)?answer:null;
            index++;
            answerParams(params,result,index,fnCallBack);            
        })
    }

    this.help=function(commandValue){
        zun.console('Zunkernel help:');
        zun.console('Command:'+commandValue.name);
        zun.console('Params for command:'+commandValue.name);
        for(var i in commandValue.params){
            zun.console(commandValue.params[i].name+' :'+commandValue.params[i].text)
        }

    }

    this.defaultCommand=function(){

        //Comando para ejecutar el framework
        this.registerCommand('start',[],'Star server',function(params,values){            
            zun.handlerExpress.initWebServer();
            zun.loadRoutingByBundles();
            //Hay que evitar que los desarrolladores cambien las variables del objeto zun
		    Object.freeze(zun);
        })

        //Comando que te da la version de zunkernel
        this.registerCommand('autoload',[],'Install Framework',function(params,values){
            zun.folderSystem();
            process.exit()
        })

        //Comando que te da la version de zunkernel
        this.registerCommand('--version',[],'Zunkernel version',function(params,values){
            console.log(params,values);
            /* var package_dir=zun.basedir+'/node_modules/zunkernel/package.json';
            var package=JSON.parse( fs.readFileSync(package_dir, "utf-8") );
            zun.console(package.version); */
            process.exit();
        })

        //Comando que te da la version de zunkernel
        this.registerCommand('--help',[],'Zunkernel help',function(param,values){
            if(values.length){
                var commandValue=_this.exist(values[0])
                if(commandValue){
                    _this.help(commandValue);
                    process.exit();
                }else zun.console('This command not exist.','error');
            }else{
                for(var i in _this.listCommand){
                    zun.console(_this.listCommand[i].name+': '+_this.listCommand[i].description,'warning')
                }
                process.exit();
            }
            
        })

        //Comando que copia los asset del bundle para la carpeta www y viceversa
        this.registerCommand('asset',[{name:'-b',text:'Bundle name',required:true}],'Copy the resource of the public bundle folder for the www and vice versa foolder.',function(param,values){
            if(!zun.existBundle(params['-b']))return zun.console("Bundle "+params['-b']+" not exist",'error');
            //Pregunto si contiene el parametro -r(reverse) que copia de la carpeta www a la carpeta publica
            if(values.indexOf('-r')!=-1){
                try {
                    currentDir = zun.basedir+"/bundles/" + param['-b'] + "/public/";
                    //Si existe la ruta la elimino
                    if (fs.existsSync(currentDir))
                        deleteFolderRecursive(currentDir);
                    originDir = zun.basedir + "/www/" + param['-b'];
                    if (!fs.existsSync(currentDir))
                        fs.mkdirSync(currentDir);
                    destinyDir = currentDir;
                    copy(originDir, destinyDir);
                    zun.console('Resources copied successfuly in the public folder of de bundle '+param['-b']);
                } catch (error) {
                    console.log(error)
                    zun.console( "Error to copy bundle asset:"+param['-b'],'error');
                }
            }else{
                try {
                    currentDir = zun.basedir + "/www/" + param['-b'];
                    //Si existe la ruta la elimino
                    if (fs.existsSync(currentDir))
                        deleteFolderRecursive(currentDir);
                    if (!fs.existsSync(currentDir))
                        fs.mkdirSync(currentDir);
                    originDir = zun.basedir+"/bundles/" + param['-b'] + "/public";
                    destinyDir = zun.basedir + "/www/" + param['-b'];
                    copy(originDir, destinyDir);
                    zun.console('Resources copied successfuly in the www folder of de bundle '+param['-b']);
                } catch (err) {
                    console.log(err.message)
                    zun.console( "Error to copy bundle asset:"+param['-b'],'error');
                }
            }
            process.exit();
        })

        //Comando para crear bundles
        this.registerCommand('create-bundle',[{name:'-b',text:'Bundle name',required:true}],'Create new bundle',function(params,values){
            
            var name_bundle=params['-b'].toLowerCase();
            var dirbundle = zun.basedir + "/bundles/" + name_bundle.toLowerCase();
            //Creo las carpetas del bundle
            fs.mkdirSync(dirbundle);
            fs.mkdirSync(dirbundle + "/config");
            fs.mkdirSync(dirbundle + "/controller");
            fs.mkdirSync(dirbundle + "/view");
            fs.mkdirSync(dirbundle + "/model");
            fs.mkdirSync(dirbundle + "/public");
            //Creo los archivos de routing y configuracion con valores por defecto
            var data = {
                "router":[
                    "routing.json"
                ]
            }
            fs.writeFileSync(dirbundle + "/config/config.json", JSON.stringify(data, null, "\t"));
            var dataRouting = [{
                "url": "/",
                "method": "get",
                "controller":"main",
                "fn": "index",
                "authenticated":false,
                "roles":""
            }]
            fs.writeFileSync(dirbundle + "/config/routing.json", JSON.stringify(dataRouting, null, "\t"));
            //Creo un controlador por defecto
            var dataControler = "exports.index=index; \n\nfunction index(req,res){\n\tres.send(zun." + name_bundle + ".render('index.html',{name:'" + name_bundle + "'}));\n}";
            fs.writeFileSync(dirbundle + "/controller/main.js", dataControler);
            var config = JSON.parse(fs.readFileSync(zun.basedir+ '/config.json', "utf-8"));
            config.bundles.push({ "name": name_bundle.toLowerCase(),"router":"/"+name_bundle,"main":"controller/main.js" });
            fs.writeFileSync(zun.basedir + "/config.json", JSON.stringify(config, null, "\t"));
            //Creo una vista por defecto
            var html = 
            `<!DOCTYPE html> 
            <html> 
                <head> 
                    <title>My App</title> 
                </head> 
                <body> 
                    <center> <h3>Congratulations!!! Created your new bundle:</h3> <h4>{{name}}</h4> </center> 
                </body> 
            </html>`;
            fs.writeFileSync(dirbundle + "/view/index.html", html);
            zun.console('Create bundle '+name_bundle+' successfully!!!');
        })

        //Comando para eliminar bundles
        this.registerCommand('drop-bundle',[{name:'-b',text:'Bundle name',required:true}],'Drop bundle',function(params,values){
            if(!zun.existBundle(params['-b']))return zun.console("Bundle "+params['-b']+" not exist",'error');
            var name_bundle=params['-b'].toLowerCase();
            var dirbundle = zun.basedir + "/bundles/" + name_bundle.toLowerCase();            
            var dir_asset=zun.basedir + "/www/" +name_bundle;
            if(!fs.existsSync(dir_asset))
                zun.console('The asset folder does not exist.','error')
            else{
                deleteFolderRecursive(dir_asset);
                zun.console('Asset Bundle  drop successfully');
            }

            zun.config.bundles=zun.config.bundles.filter(function(bundle){
                return bundle.name!==name_bundle;
            })
            fs.writeFileSync(zun.basedir + "/config.json", JSON.stringify(zun.config, null, "\t"));
            zun.console('Bundle Unregistered Correctly');
            
            if(!fs.existsSync(dirbundle))
                zun.console('The bundle folder does not exist.','error')
            else{
                deleteFolderRecursive(dirbundle);
                zun.console('Bundle drop successfully');
            }
            
            process.exit();
        })

        //Comando que instala un bundle de un archivo .zip y lo registra en el framework
        this.registerCommand('install',[{name:'-b',text:'Bundle name',required:true},{name:'-f',text:'Path or URL file',required:true}],'Install bundle',function(params,values){
            var zlib=require('zlib');
            if (fs.existsSync(params['-f'])){
                var buffer=fs.readFileSync(params['-f'], "binary");
                console.log(buffer.toString())
                zlib.unzip(buffer,function(error,buffer){
                    console.log('oooo');
                    
                    if(error)return console.log('Error to unzip bundle.','error');
                    zun.console('ddddd:','warning')
                    //fs.writeFileSync(zun.basedir+'/bundles')
                })
            }else{
                console.log('Good:',params['-f']);
            }
            
            /*if(!zun.existBundle(params['-b'])){
                zun.config.bundles.push({ "name": params['-b'].toLowerCase(),router:"/"+params['-b'].toLowerCase() });
                fs.writeFileSync(zun.basedir + "/config.json", JSON.stringify(zun.config, null, "\t"));
                zun.console('Bundle Registered Correctly');
            }
            if (fs.existsSync(zun.basedir+'/bundles/'+params['-b']+'/public'))
                zun.Command.execute(['asset','-b',params['-b']])*/
            process.exit();
        })

        //Comando para sincronizar los modelos con la base de datos
        this.registerCommand('sync-model',[{name:'-m',text:'Model name',required:false}],'Syncronize bundle to database',function(params,values){
            var driver=zun.config.database.driver
            if(driver!='sequelize')  
                return zun.console("This command only works with the sequelize handler","error");
            if(params['-m']){
                try {
                    var model=params['-m'];
                    if(values.indexOf('-f')!=-1){
                        zun.model[model].sync({force:true})
                        .then(function(){
                            zun.console('Model '+model+' synchronized successfully');
                            process.exit();
                        })
                        .catch(function(error){
                            zun.console('Error!!! when synchronizing the '+model+'. '+error.message,'error');
                            process.exit();
                        })
                    }else{
                        zun.model[model].sync()
                        .then(function(){
                            zun.console('Model '+model+' synchronized successfully');
                            process.exit();
                        })
                        .catch(function(error){
                            zun.console('Error!!! when synchronizing the '+model+'. '+error.message,'error');
                            process.exit();
                        })
                    }
                    
                } catch (error) {
                    zun.console('Error!!! require model '+model+'. '+error.message,'error');
                    process.exit();
                }
            }else{
                try {
                    if(values.indexOf('-f')!=-1){
                        zun.db.sync({force: true})
                        .then(function(){
                            zun.console('Database synchronized successfully');
                            process.exit();
                        })
                        .catch(function(error){
                            zun.console('Error!!! when synchronizing the database. '+error.message,'error');
                            process.exit();
                        })
                    }else{
                        zun.db.sync()
                        .then(function(){
                            zun.console('Database synchronized successfully');
                            process.exit();
                        })
                        .catch(function(error){
                            zun.console('Error!!! when synchronizing the database. '+error.message,'error');
                            process.exit();
                        })
                    }
                    
                } catch (error) {
                    zun.console('Error!!! when synchronizing the database. '+error.message,'error');
                    process.exit();
                }
            }
        })

        //Comando para sincronizar los modelos con la base de datos
        this.registerCommand('drop-model',[{name:'-m',text:'Model name',required:false}],'Syncronize bundle to database',function(params,values){
            var driver=zun.config.database.driver
            if(driver!='sequelize')  
                return zun.console("This command only works with the sequelize handler","error");
            if(params['-m']){                
                try {
                    var model=params['-m'];
                    zun.model[model].drop()
                    .then(function(){
                        zun.console('Model '+model+' drop successfully');
                        process.exit();
                    })
                    .catch(function(error){
                        zun.console('Error!!! when drop the '+model+'. '+error.message,'error');
                        process.exit();
                    })
                } catch (error) {
                    zun.console('Error!!! require model '+model+'. '+error.message,'error');
                    process.exit();
                }
            }else{
                zun.db.drop()
                .then(function(){
                    zun.console('Database drop successfully');
                    process.exit();
                })
                .catch(function(error){
                    zun.console('Error!!! when drop the database. '+error.message,'error');
                    process.exit();
                })
            }
        })

        //Comando que permite mapear la base de datos a modelos
        this.registerCommand('map-models',[{name:'-b',text:'Bundle name',required:true}],'Mapping database to model',function(params,values){
            if(!zun.existBundle(params['-b']))return zun.console("Bundle "+params['-b']+" not exist",'error');
            var driver=zun.config.database.driver
            if(driver!='sequelize'){
                zun.console("This command only works with the sequelize handler","error");
                process.exit();
            }
            try {
                require('sequelize-auto')
            } catch (error) {
                zun.console("This command only works with the sequelize-auto module","error");
                process.exit();
            }
            const execSync = require('child_process').execSync;
            var dirSequelizeAuto=zun.basedir+'/node_modules/sequelize-auto/bin/sequelize-auto';
            var model_dir=zun.basedir+'/bundles/'+params['-b']+'/model/';
            var db_data=zun.config.database
            var dialect=db_data.options.dialect
            var data='node '+dirSequelizeAuto+'  -o "'+model_dir+'" -d '+db_data.name+' -h '+db_data.options.host+' -u '+db_data.username+' -p '+db_data.options.port+' -x '+db_data.password+' -e '+dialect+'';
            var cmd = execSync(data);
            zun.console('Mapping of models executed correctly');            
        })


        //Comando que permite ejecutar un funcion javascript dentro de un archivo
        this.registerCommand('create-model',[{name:'-b',text:'Bundle name',required:true},{name:'-m',text:'Model name',required:true}],'Generate model.',function(params,values){            
            //console.log(zun.db.modelManager.getModel('tarjeta').attributes)
            var properties=[];
            if(zun.config.database.driver!='sequelize' && zun.config.database.driver!='mongoose'){
                zun.console('Driver '+zun.config.database.driver+' is not suppoted in the framework.','error');
                process.exit();
            }
            zun.console('Execute Ctrl + C to exit.','warning');
            generateModel(properties,params['-m'],params['-b']);
            rl.on('close',function(){
                var result={};
                if(zun.config.database.driver==='sequelize'){
                    result.id={
                        type: "###INTEGER@@@",
                        allowNull: false,
                        primaryKey: true,
                        autoIncrement: true
                    }
                    for(let i in properties){
                        result[properties[i].name]={
                            type: "###"+properties[i].type+'@@@',
                            allowNull: true
                        }
                    }
                    var templateResult="module.exports = function(sequelize, DataTypes) {\n\treturn sequelize.define('"+params['-m']+"',\t"+JSON.stringify(result, null, "\t")+",\n\t{tableName: '"+params['-m']+"'}\n)}"
                    templateResult=templateResult.replace(/\"###/ig,"DataTypes.");
                    templateResult=templateResult.replace(/@@@\"/ig,"");
                    var modelDir=zun.basedir+'/bundles/'+params['-b']+'/model/'+params['-m']+'.js';
                    try {
                        fs.writeFileSync(modelDir, templateResult);
                        zun.console('Successfully created model');
                    } catch (error) {
                        zun.console('Error when creating the model','error');
                        console.log(error)
                    }
                    process.exit()
                }
                if(zun.config.database.driver==='mongoose'){
                    for(let i in properties){
                        result[properties[i].name]={
                            type: "###"+properties[i].type+'@@@'
                        }
                    }
                    var templateResult="module.exports = function() {\n\tvar schema = new zun.mongoose.Schema("+JSON.stringify(result, null, "\t")+")\n\t return zun.db.model('"+params['-m']+"', schema);\n}";
                    templateResult=templateResult.replace(/\"###/ig,"");
                    templateResult=templateResult.replace(/@@@\"/ig,"");
                    var modelDir=zun.basedir+'/bundles/'+params['-b']+'/model/'+params['-m']+'.js';
                    try {
                        fs.writeFileSync(modelDir, templateResult);
                        zun.console('Successfully created model');
                    } catch (error) {
                        zun.console('Error when creating the model','error');
                        console.log(error)
                    }
                    process.exit();
                }
                
                

                
            })
            
        })

        function generateModel(columns,model,bundle){
            var property={}
            zun.console('--------------------------------------------------------------','warning')
            rl.question('Column name: ',function(answer){            
                if(!answer){
                    zun.console('Property name is required.');    
                    generateModel(properties,model,bundle);                
                } 
                property.name=answer; 
                rl.question('Data type [string,date,...]: ',function(answer){            
                    if(zun.config.database.driver==='sequelize'){
                        if(!answer)
                            property.type='STRING';
                        else{
                            var type=answer.toUpperCase();
                            if(zun.sequelize[type])
                                property.type=type;
                            else{
                                zun.console('The sequelize driver does not support this type of data','error');
                                return generateModel(columns,model,bundle);
                            }
                        }
                    }
                    if(zun.config.database.driver==='mongoose'){
                        if(!answer)
                            property.type='String';
                        else{
                            var type=answer.replace(/\b\w/g, l => l.toUpperCase());
                            if(zun.mongoose.Schema.Types[type])
                                property.type=type;
                            else{
                                zun.console('The mongoose driver does not support this type of data','error');
                                return generateModel(columns,model,bundle);
                            }
                        }
                    }
                    columns.push(property);
                    generateModel(columns,model,bundle)        
                })

            })
            
        }

        //Comando que permite crear una api rest
        this.registerCommand('restapi',[{name:'-b',text:'Bundle name',required:true},{name:'-m',text:'Model name',required:true},{name:'-auth',text:'Aunthenticate mode[session or jsonwebtoken]',required:false}],'Create REST Full API.',function(params,values){
            if(!zun.existBundle(params['-b']))return zun.console("Bundle "+params['-b']+" not exist",'error');
            var bundledir=zun.basedir+"/bundles/"+params['-b'];
            var driver=zun.config.database.driver
            if (!fs.existsSync(bundledir+'/model/'+params['-m']+'.js'))
                zun.console("This model not exist in the bundle:"+params['-b'],'warning');
            //zun.console("Goood",'warning');
            var routingDir=bundledir+'/config/routing';
            //Si no existe la carpeta routing en el bundle especificado, la creo
		    if (!fs.existsSync(routingDir))
                fs.mkdirSync(routingDir);
            if(params['-auth'] && (params['-auth']==='session' || params['-auth']==='jsonwebtoken')){
                var auth=params['-auth'];
            }else var auth=""
            
            //Copio el template del routing para esa carpeta
            var routingTemplate=zun.renderFile(zun.basedir+'/node_modules/zunkernel/lib/template_routing.json',{model:params['-m'],auth:auth})
            if(!fs.writeFileSync(routingDir + "/"+params['-m']+".json", routingTemplate)){
                //Leo el config.json del bundle
                var config=JSON.parse( fs.readFileSync(bundledir+'/config/config.json', "utf-8") );
                if(config.router.indexOf('routing/'+params['-m']+".json")==-1)
                    config.router.push('routing/'+params['-m']+".json");
                 fs.writeFileSync(bundledir + "/config/config.json", JSON.stringify(config, null, "\t"));
                var controllerTemplate=zun.renderFile(zun.basedir+'/node_modules/zunkernel/lib/template_controller.js',{bundle:params['-b'],model:params['-m'],driver:driver})
                if(!fs.writeFileSync(bundledir + "/controller/"+params['-m']+".js", controllerTemplate)){
                    zun.execCommand(["repository",'-b',params['-b'],'-m',params['-m']]);
                    zun.console("The RestApi was create successfully.");
                }else zun.console("Error to create apirest:"+params['-b'],'error');                    
            }else zun.console("Error to create apirest:"+params['-b'],'error');
            process.exit();
        })


        //Comando que permite crear el patron repository
        this.registerCommand('repository',[{name:'-b',text:'Bundle name',required:true},{name:'-m',text:'Model name',required:true}],'Create pattern Repository.',function(params,values){
            if(!zun.existBundle(params['-b']))return zun.console("Bundle "+params['-b']+" not exist",'error');
            var bundledir=zun.basedir+"/bundles/"+params['-b'];
            var driver=zun.config.database.driver
            if (!fs.existsSync(bundledir+'/model/'+params['-m']+'.js'))
                zun.console("This model not exist in the bundle:"+params['-b'],'warning');
            var repositoryDir=bundledir+'/repository';
            //Si no existe la carpeta routing en el bundle especificado, la creo
		    if (!fs.existsSync(repositoryDir))
                fs.mkdirSync(repositoryDir);
            //Copio el template del routing para esa carpeta
            var repositoryTemplate=zun.renderFile(zun.basedir+'/node_modules/zunkernel/lib/template_repository.js',{bundle:params['-b'],model:params['-m'],driver:driver})
            if(!fs.writeFileSync(bundledir + "/repository/"+params['-m']+".js", repositoryTemplate))
                zun.console("The repository was create successfully.");
            else zun.console('Error create repository!!!','error')
            process.exit();
        })

        //Comando que permite encriptar cadenas de texto
        this.registerCommand('encrypt',[],'Encrypt text string.',function(params,values){
            try {
                zun.console(zun.encrypt(values[0]));
            } catch (error) {
                zun.console('Error!!! encrypt string. '+error.message,'error');
            }
            process.exit();
        })

        //Comando que permite desencriptar cadenas de texto
        this.registerCommand('decrypt',[],'Dencrypt text string.',function(params,values){
            try {
                zun.console(zun.decrypt(values[0]));
            } catch (error) {
                zun.console('Error!!! decrypt string. '+error.message,'error');
            }
            process.exit();
        })

    }
}



function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
                zun.console('Delete file:'+curPath,'warning');
            }
        });
        try {
            fs.rmdirSync(path);
        } catch (error) {
            
        }
        
    }
}

function copy(srcDir, dstDir) {
    var results = [];
    var list = fs.readdirSync(srcDir);
    var src, dst;
    list.forEach(function(file) {
        src = srcDir + '/' + file;
        dst = dstDir + '/' + file;
        //console.log(src);
        var stat = fs.statSync(src);
        if (stat && stat.isDirectory()) {
            try {
                fs.mkdirSync(dst);
            } catch (e) {
                zun.console('Directory already exists: ' + dst,'error');
            }
            results = results.concat(copy(src, dst));
        } else {
            try {
                //fs.createReadStream(src).pipe(fs.createWriteStream(dst));
                fs.writeFileSync(dst, fs.readFileSync(src));
                zun.console('Copy file:'+dst,'warning');
            } catch (e) {
                zun.console('Could\'t copy file: ' + dst+'. '+e.message,'error');
            }
            results.push(src);
        }
    });
    return results;
}

