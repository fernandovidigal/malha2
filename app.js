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

// Database
const sequelize = require('./helpers/database');

// Models
const Users = require('./models/user');
const Localidades = require('./models/Localidades');
const Escaloes = require('./models/Escaloes');
const Torneios = require('./models/Torneios');
const Equipas = require('./models/Equipas');
const Jogos = require('./models/Jogos');
const Parciais = require('./models/Parciais');

// Definir relações entre as bases de dados
Torneios.hasMany(Equipas, {foreignKey: 'torneioId', onDelete: 'cascade'});
Equipas.belongsTo(Torneios, {foreignKey: 'torneioId'});
Localidades.hasMany(Equipas, {foreignKey: 'localidadeId', onDelete: 'cascade'});
Equipas.belongsTo(Localidades, {foreignKey: 'localidadeId'});
Escaloes.hasMany(Equipas, {foreignKey: 'escalaoId', onDelete: 'cascade'});
Equipas.belongsTo(Escaloes, {foreignKey: 'escalaoId'});


Torneios.hasMany(Jogos, {foreignKey: 'torneioId', onDelete: 'cascade'});
Jogos.belongsTo(Torneios, {foreignKey: 'torneioId'});
Escaloes.hasMany(Jogos, {foreignKey: 'escalaoId', onDelete: 'cascade'});
Jogos.belongsTo(Escaloes, {foreignKey: 'escalaoId'});
Equipas.hasMany(Jogos, {foreignKey: 'equipa1Id', onDelete: 'set null'});
Jogos.belongsTo(Equipas, {foreignKey: 'equipa1Id'});
Equipas.hasMany(Jogos, {foreignKey: 'equipa2Id', onDelete: 'set null'});
Jogos.belongsTo(Equipas, {foreignKey: 'equipa2Id'});

Jogos.hasMany(Parciais, {foreignKey: 'jogoId', onDelete: 'cascade'});
Parciais.belongsTo(Jogos, {foreignKey: 'jogoId'});
Equipas.hasMany(Parciais, {foreignKey: 'equipaId', onDelete: 'cascade'});
Parciais.belongsTo(Equipas, {foreignKey: 'equipaId'});



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
const adminTorneios = require('./routes/admin/torneios');
const equipas = require('./routes/equipas');
const torneios = require('./routes/torneios');

app.use('/login', login);
app.use('/', index);
app.use('/admin/utilizadores', adminUtilizadores);
app.use('/admin/localidades', adminLocalidades);
app.use('/admin/escaloes', adminEscaloes);
app.use('/admin/torneios', adminTorneios);
app.use('/equipas', equipas);
app.use('/torneio', torneios);

sequelize
    .sync()
    .then(async (result) =>{
        await Users.findOrCreate({
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