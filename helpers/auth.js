module.exports = {

    userAuthenticated: function(req, res, next){
        if(req.isAuthenticated()) {
            return next();
        }

        res.redirect('/login');
    },

    checkAdminStatus: function(req, res, next){
        if(req.user.level == 10) {
            return next();
        }

        req.flash('error', 'Não têm permisão para aceder a essa página. Contacte o administrador!');
        res.redirect('../');
    }
}