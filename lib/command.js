var fs = require('fs');


exports.ExecCommand=function(values){
    switch (values[0]) {
        case '-v':{
            var package_dir=zun.basedir+'/node_modules/zunkernel/package.json';
            var package=JSON.parse( fs.readFileSync(package_dir, "utf-8") );
            console.log('\x1b[32m',package.version,'\x1b[0m');
        }break;
        case 'bundle:asset':
        {

            if (values[1] == "-a") {//Con el comando -a (all) copia todos los asset de todos los modulos
                var haveError=false;
                for (i in zun.config.bundles) {
                    try {
                        currentDir = zun.basedir + "/www/" + zun.config.bundles[i].name;

                        //Si existe la ruta la elimino
                        if (fs.existsSync(currentDir)){

                            deleteFolderRecursive(currentDir);
                        }
                        originDir = zun.basedir+"/bundles/" + zun.config.bundles[i].name + "/public";
                        fs.mkdirSync(zun.basedir + "/www/" + zun.config.bundles[i].name);
                        destinyDir = zun.basedir + "/www/" + zun.config.bundles[i].name;
                        copy(originDir, destinyDir);

                    } catch (error) {
                        haveError=true;
                        console.log('\033[31m', "Error to delete bundle asset:"+ zun.config.bundles[i].name,'\x1b[0m');
                    }

                }
                if(!haveError)
                    console.log('\x1b[32m','***Resources published correctly***','\x1b[0m');
                return;
            }
            //Con el comando -r (reverse) copia todos los asset de la carpeta www a la carpeta public del bundle en especifico
            //Ejemplo zun bundle:asset bundle_name -r
            if(values[2] == "-r"){
                if(values[1]){
                    try {
                        currentDir = zun.basedir+"/bundles/" + values[1] + "/public";
                        stats = fs.lstatSync(currentDir);
                        //Si existe la ruta la elimino
                        if (fs.existsSync(currentDir))
                            deleteFolderRecursive(currentDir);
                        originDir = zun.basedir + "/www/" + values[1];
                        fs.mkdirSync(currentDir);
                        destinyDir = currentDir;
                        copy(originDir, destinyDir);
                        console.log('\x1b[32m','***Resources published correctly***','\x1b[0m');
                    } catch (error) {
                        console.log('\033[31m', "Error to delete bundle asset:"+ values[1],'\x1b[0m');
                    }

                }else{
                    console.log('\033[31m', "Bundle name not exist",'\x1b[0m');
                }

            }else {
                if(!zun.existBundle(values[1]))return showError("Bundle "+values[1]+" not exist");
                if(values[1]){
                    try {
                        currentDir = zun.basedir + "/www/" + values[1];
                        //Si existe la ruta la elimino
                        if (fs.existsSync(currentDir))
                            deleteFolderRecursive(currentDir);
                        fs.mkdirSync(zun.basedir + "/www/" + values[1]);
                        originDir = zun.basedir+"/bundles/" + values[1] + "/public";
                        destinyDir = zun.basedir + "/www/" + values[1];
                        copy(originDir, destinyDir);
                        console.log('\x1b[32m','***Resources successfully copied***','\x1b[0m');
                    } catch (err) {
                        showError("Error!!! This bundle not exist."+error.message);
                    }
                }else showError("This bundle not exist.")

            }
        }break;
        case 'bundle:create':
        {
            if (values[1]) {
                var name_bundle=values[1].toLowerCase();
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
                    "database": {
                        "name": "namedb",
                        "host": "localhost",
                        "port": "",
                        "username": "user",
                        "password": "pass",
                        "driver": "sequelize:none"
                    },
                    "email": {
                        "service": "Gmail",
                        "auth": {
                            "user": "username",
                            "pass": "password"
                        }
                    },
                    "router":[
                        "routing.json"
                    ]

                }
                fs.writeFileSync(dirbundle + "/config/config.json", JSON.stringify(data, null, "\t"));
                var dataRouting = [{
                    "url": "/",
                    "method": "get",
                    "path": "main:index"
                }]
                fs.writeFileSync(dirbundle + "/config/routing.json", JSON.stringify(dataRouting, null, "\t"));
                //Creo un controlador por defecto
                var dataControler = "exports.index=index; \n\nfunction index(req,res){\n\tres.send(zun." + name_bundle + ".render('index.html',{name:'" + name_bundle + "'}));\n}";
                fs.writeFileSync(dirbundle + "/controller/main.js", dataControler);
                var config = JSON.parse(fs.readFileSync(zun.basedir+ '/config.json', "utf-8"));
                config.bundles.push({ "name": name_bundle.toLowerCase(),"router":"/"+name_bundle });
                fs.writeFileSync(zun.basedir + "/config.json", JSON.stringify(config, null, "\t"));
                //Creo una vista por defecto
                var html = '<!DOCTYPE html> <html> <head> <title></title> </head> <body> <center> <h3>Congratulations!!! Created your new bundle:</h3> <h4>{{name}}</h4> </center> </body> </html>';
                fs.writeFileSync(dirbundle + "/view/index.html", html);
                console.log('\x1b[32m',"Create bundle "+values[1]+" successfully!!!",'\x1b[0m');
                return true;
                
            }
        }break;
        case 'bundle:install':{//Ejecuta el archivo installer de bundle(Este archivo debe estar dentro de una carpeta llamada installer)
            
            config = JSON.parse(fs.readFileSync(zun.basedir + '/config.json', "utf-8"));
            if(values[1]){
                var exist_bundle=false;
                for(i in config.bundles){
                    if(config.bundles[i].name==values[1]){
                        exist_bundle=true;
                    }
                }
                if(!exist_bundle){//Si el bundle no esta registrado lo registro
                    config.bundles.push({ "name": values[1].toLowerCase(),router:"/"+values[1].toLowerCase() });
                    fs.writeFileSync(zun.basedir + "/config.json", JSON.stringify(config, null, "\t"));
                    console.log('\x1b[32m','***Bundle Registered Correctly***','\x1b[0m');
                }
                zun.execCommand(['bundle:asset',values[1]])
            }
        }break;
        case 'bundle:model:sync':{//Busca los models del bundle y los sincroniza con la base de datos
            if(!zun.existBundle(values[1]))return showError("Bundle "+values[1]+" not exist");
            if(values[2]){
                try {
                    eval('zun.'+values[1]+'.model.'+values[2]+'.sync();');
                } catch (error) {
                    return showError('Error!!! require model '+values[2]+'. '+error.message);
                }
                showSuccess('Database synchronized successfully');
            }else{
                try {
                    eval('zun.'+values[1]+'.db.sync();');
                    showSuccess('Database synchronized successfully');
                } catch (error) {
                    showError('Error!!! when synchronizing the database. '+error.message);
                }
            }
            
        }break;
        case 'bundle:model:sync-forse':{//Busca los models del bundle y los sincroniza con la base de datos, borra los datos
            if(!zun.existBundle(values[1]))return showError("Bundle "+values[1]+" not exist");
            if(values[2]){
                try {
                    eval('zun.'+values[1]+'.model.'+values[2]+'.sync({force: true});');
                } catch (error) {
                    return showError('Error!!! require model '+values[2]+'. '+error.message);
                }
            }else{
                eval('zun.'+values[1]+'.db.sync({force: true});');
                showSuccess('Database synchronized successfully');
            }
            
        }break;
        case 'bundle:model:map':{//Mapea los model segun la base de datos
            if(!zun.existBundle(values[1]))return showError("Bundle "+values[1]+" not exist");
            if (values[1]) {
                const execSync = require('child_process').execSync;
                var dirSequelizeAuto=zun.basedir+'/node_modules/sequelize-auto/bin/sequelize-auto';
                var model_dir=zun.basedir+'/bundles/'+values[1]+'/model/';
                eval('var db_data=zun.'+values[1]+'.config.database');
                var driver=db_data.driver.split(':')[1]
                var data='node '+dirSequelizeAuto+'  -o "'+model_dir+'" -d '+db_data.name+' -h '+db_data.host+' -u '+db_data.username+' -p '+db_data.port+' -x '+db_data.password+' -e '+driver+'';
                console.log(data)
                var cmd = execSync(data);
                console.log('\x1b[32m','Mapping of models executed correctly','\x1b[0m');
            }

        }break;
        case 'bundle:model:drop':{//Busca los models del bundle y los elimina con la base de datos
            if(!zun.existBundle(values[1]))return showError("Bundle "+values[1]+" not exist");
            try {
                eval('zun.'+values[1]+'.db.drop();');
            } catch (error) {
                showError('Error!!! when synchronizing the database. '+error.message);
            }
        }break;
        case 'bundle:command':{//Ejecuta una funcion como comando
            if(!zun.existBundle(values[1]))return showError("Bundle "+values[1]+" not exist");
            var bundledir=zun.basedir+"/bundles/"+values[1];
            if(values[2]){

                try{
                    var aux=values[2].split(":")
                    var filedir=bundledir+"/"+aux[0];
                    var params=values.slice(3,values.length);
                    eval("require(filedir)."+aux[1]+"("+JSON.stringify(params)+")")
                }catch (error){
                    showError('Error!!! Debe especificar la ruta del archivo y la funciona a ejecutar. Ejemplo ruta:funcion(command/task:callback). '+error.message);
                }
            }else showError('Error!!! Debe especificar la ruta del archivo y la funciona a ejecutar. Ejemplo ruta:funcion(command/task:callback). '+error.message);

        }break;
        case 'encrypt':{//Busca los models del bundle y los elimina con la base de datos
            try {
                zun.console(zun.encrypt(values[1]));
                return zun.encrypt(values[1]);
            } catch (error) {
                showError('Error!!! when synchronizing the database. '+error.message);
            }
        }break;
        case 'decrypt':{//Busca los models del bundle y los elimina con la base de datos
            try {
                zun.console(zun.decrypt(values[1]));
                return zun.decrypt(values[1]);
            } catch (error) {
                showError('Error!!! when synchronizing the database. '+error.message);
            }
        }break;
        default:
        {
            showError('Error this command does not exist.');
        }break;
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
            }
        });
        fs.rmdirSync(path);
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
                showError('directory already exists: ' + dst);
            }
            results = results.concat(copy(src, dst));
        } else {
            try {
                //fs.createReadStream(src).pipe(fs.createWriteStream(dst));
                fs.writeFileSync(dst, fs.readFileSync(src));
            } catch (e) {
                showError('could\'t copy file: ' + dst);
            }
            results.push(src);
        }
    });
    return results;
}

function error(msg){
    console.log('\033[31m', msg,'\x1b[0m');

}

function showError(value){
    console.log('\x1b[41m',value,'\x1b[0m');
}

function showSuccess(value){
    console.log('\x1b[32m',value,'\x1b[0m');
}

