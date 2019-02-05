/**
 * Created by Asiel on 10/02/2018.
 */
zun.repository.{{model}}={
    list:function(options){
        options=(options)?options:{}
        return new Promise(function(resolve, reject){
            {% if driver=='sequelize' %}
            zun.model.{{model}}.findAll(options)
            .then(function(data){
                resolve(data)
            })
            .catch(function(error){
                reject(error)
            })
            {% endif %}
            {% if driver=='mongoose' %}
            zun.model.{{model}}.find({}, function (error, data) {
                if (error) 
                    return reject(error.message)
                else resolve(data);            
            }).skip(options.offset).limit(options.limit)
            {% endif %}
        })
        
    },
    getById:function(id){
        return new Promise(function(resolve, reject){
            {% if driver=='sequelize' %}
            zun.model.{{model}}.findById(id)
            .then(function(data){
                resolve(data);  
            })
            .catch(function(error){
                reject(error);
            })
            {% endif %}
            {% if driver=='mongoose' %}
            zun.model.{{model}}.findById(id, function (error, data) {
                if (error) 
                    reject(error)
                else resolve(data);            
            });
            {% endif %}
        })
    },
    create:function(value){
        return new Promise(function(resolve, reject){
            {% if driver=='sequelize' %}
            zun.model.{{model}}.create(value)
            .then(function(data){
                resolve(data);
            })
            .catch(function(error){
                reject(error);
            })
            {% endif %}
            {% if driver=='mongoose' %}
            zun.model.{{model}}.create(value, function (error, data) {
                if (error) 
                    return reject(error.message);
                resolve(data);
            })
            {% endif %}
        })
    },
    update:function(id,value){
        return new Promise(function(resolve, reject){
            {% if driver=='sequelize' %}
            zun.model.{{model}}.update(value,{
                where:{id:id}
            })
            .then(function(data){
                resolve(data);
            })
            .catch(function(error){
                reject(error);
            })
            {% endif %}
            {% if driver=='mongoose' %}
            zun.model.{{model}}.findById(id, function (error, {{model}}) {
                if (error) reject(error.message);
                Object.assign({{model}}, value);
                {{model}}.save(function (err, updated_{{model}}) {
                    if (err) res.status(500).send(err.message);
                    resolve(updated_{{model}});
                });
            });
            {% endif %}
        })
    },
    delete:function(id){
        return new Promise(function(resolve, reject){
            {% if driver=='sequelize' %}
            zun.model.{{model}}.destroy({
                where:{id: id}
            }).then(function({{model}}){
                resolve('ok');
            }).catch(function(error){
                reject(error.message);
            })
            {% endif %}
            {% if driver=='mongoose' %}
            zun.model.{{model}}.findById(id, function (error, {{model}}) {
                if (error) res.status(500).send(error.message);
                {{model}}.remove({},function (err, updatedTank) {
                    if (err) reject(error.message);
                    resolve('ok');
                });
            });
            {% endif %}
        })
    }
}