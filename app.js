const express = require('./node_modules/express');
const app = express();
const port = 3000;
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');

const util = require('./helpers/util');
const fileStruct = require('./helpers/fileStruct');

// Chech File Structure
fileStruct.dataDirectoryCheck();

// Models
const User = require('./models/user');

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

// Routes
const login = require('./routes/login');
const index = require('./routes/index');

app.use('/login', login);
app.use('/', index);

sequelize
    .sync()
    .then(async (result) =>{
        await User.findOrCreate({
            where: {username: 'gestor'},
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