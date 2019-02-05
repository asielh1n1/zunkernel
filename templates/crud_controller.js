/**
 * Created by Asiel on 10/02/2018.
 */
exports.{{model|capitalize}}={
    list:function(req,res){
        zun.repository.{{model}}.list()
        .then(function(data){            
            res.send(zun.{{bundle}}.render('{{model}}/list.html',{data:data}))
        })
        .catch(function(error){
            res.send(zun.{{bundle}}.render('{{model}}/list.html',{data:[],error:error.message}));
        })
    },
    new:function(req,res){
        res.send(zun.{{bundle}}.render('{{model}}/new.html'));
    },
    edit:function(req,res){
        zun.repository.{{model}}.getById(req.params.id)
        .then(function(data){
            res.send(zun.{{bundle}}.render('{{model}}/edit.html',{data:data}));
        })
        .catch(function(error){
            res.send(zun.{{bundle}}.render('{{model}}/edit.html',{data:[],error:error.message}));
        })
    },    
    create:function(req,res){
        zun.repository.{{model}}.create(req.body)
        .then(function(data){
            res.redirect('/{{model}}')
        })
        .catch(function(error){
            res.send(zun.{{bundle}}.render('{{model}}/new.html',{error:error.menssage}));
        })
    },
    update:function(req,res){
        zun.repository.{{model}}.update(req.params.id,req.body)
        .then(function(data){
            res.redirect('/{{model}}');
        })
        .catch(function(error){
            res.send(zun.{{bundle}}.render('{{model}}/edit.html',{data:req.body,error:error.message}));
        })
    },
    delete:function(req,res){        
        zun.repository.{{model}}.delete(req.params.id)
        .then(function(data){
            res.redirect('/{{model}}');
        })
        .catch(function(error){
            res.redirect('/{{model}}',{error:error.message});
        })
    }
}