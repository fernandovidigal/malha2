const express = require('./node_modules/express');
const app = express();
const port = 3000;
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const util = require('./helpers/util');
const fileStruct = require('./helpers/fileStruct');

// Chech File Structure
fileStruct.dataDirectoryCheck();

// Models
const User = require('./models/user');
const Localidade = require('./models/Localidade');
const Escaloes = require('./models/Escaloes');

// Database
const sequelize = require('./helpers/database');

// Template View Engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Assets
app.use(express.static(path.join(__dirname, 'assets')));

// Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// SESSIONS
app.use(session({
    secret: "malhanodejs",
    resave: false,
    saveUninitialized: false,
}));

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// Flash Messages
app.use(flash());

// METHOD OVERRIDE
app.use(methodOverride('_method'));

app.use(function(req, res, next) {
    res.locals.loggedUser = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.info = req.flash('info');
    res.locals.warning = req.flash('warning');
    next();
});

// Routes
const login = require('./routes/login');
const index = require('./routes/index');
const adminUtilizadores = require('./routes/admin/utilizadores');
const adminLocalidades = require('./routes/admin/localidades');
const adminEscaloes = require('./routes/admin/escaloes');

app.use('/login', login);
app.use('/', index);
app.use('/admin/utilizadores', adminUtilizadores);
app.use('/admin/localidades', adminLocalidades);
app.use('/admin/escaloes', adminEscaloes);

sequelize
    .sync()
    .then(async (result) =>{
        await User.findOrCreate({
            where: {username: 'admin'},
            defaults: {
                password: util.encrypt('12345'),
                level: 10
            }
        })
        .then(([user, created]) => {
            // Utilizador por defeito criado.
            // Server Start
            app.listen(port, () => console.log(`Malha App em localhost:${port} ou <IP da máquina>:${port}`));
        })
        .catch((err) => {
            console.log("Não foi possível criar ou aceder ao utilizador por defeito. Contacte o administrador da aplicação.");
        });   
    })
    .catch(err =>{
        console.log(err);
    });