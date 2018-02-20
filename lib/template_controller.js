/**
 * Created by Asiel on 10/02/2018.
 */
exports.{{model}}={
    list:function(req,res){
        {% if driver=='sequelize' %}
        zun.{{bundle}}.model.{{model}}.findAndCountAll({
            offset: parseInt(req.params.offset),
			limit: parseInt(req.params.limit)
        })
        .then(function(data){
            res.send(data)
        })
        .catch(function(error){
            res.status(500).send(error.message)
        })
        {% endif %}
        {% if driver=='mongodb' %}
        zun.{{bundle}}.model.{{model}}.find({}, function (error, data) {
            if (error) 
                return res.status(500).send(error.message)
             else res.send(data);            
        });
        {% endif %}
    },
    getById:function(req,res){
        {% if driver=='sequelize' %}
        zun.{{bundle}}.model.{{model}}.findById(req.params.id)
        .then(function(data){
            res.send(data)
        })
        .catch(function(error){
            res.status(500).send(error.message)
        })
        {% endif %}
        {% if driver=='mongodb' %}
        zun.{{bundle}}.model.{{model}}.findById(req.params.id, function (error, data) {
            if (error) 
                return res.status(500).send(error.message)
             else res.send(data);            
        });
        {% endif %}
    },
    create:function(req,res){
        {% if driver=='sequelize' %}
        zun.{{bundle}}.model.{{model}}.create(req.body)
        .then(function(data){
            res.send(data)
        })
        .catch(function(error){
            res.status(500).send(error.message)
        })
        {% endif %}
        {% if driver=='mongodb' %}
        zun.{{bundle}}.model.{{model}}.create(req.body, function (error, data) {
            if (error) 
                return res.status(500).send(error.message);
            res.send(data)
        })
        {% endif %}
    },
    update:function(req,res){
        {% if driver=='sequelize' %}
        zun.{{bundle}}.model.{{model}}.update(req.body,{
            where:{id:req.body.id}
        })
        .then(function(data){
            res.send(data)
        })
        .catch(function(error){
            res.status(500).send(error.message);
        })
        {% endif %}
        {% if driver=='mongodb' %}
        zun.{{bundle}}.model.{{model}}.findById(req.body._id, function (error, {{model}}) {
            if (error) res.status(500).send(error.message);
            Object.assign({{model}}, req.body);
            {{model}}.save(function (err, updated_{{model}}) {
                if (err) res.status(500).send(err.message);
                res.send(updated_{{model}});
            });
        });
        {% endif %}
    },
    delete:function(req,res){
        {% if driver=='sequelize' %}
        zun.{{bundle}}.model.{{model}}.destroy({
            where:{id: req.params.id}
        }).then(function({{model}}){
            res.send('ok');
        }).catch(function(error){
            res.status(500).send(error.message)
        })
        {% endif %}
        {% if driver=='mongodb' %}
        zun.{{bundle}}.model.{{model}}.findById(req.body._id, function (error, {{model}}) {
            if (error) res.status(500).send(error.message);
            {{model}}.remove({},function (err, updatedTank) {
                if (err) res.status(500).send(err.message);
                res.send('ok');
            });
        });
        {% endif %}
    }
}