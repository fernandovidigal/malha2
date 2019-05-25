const express = require('./node_modules/express');
const app = express();
const port = 3000;
const path = require('path');
const bodyParser = require('body-parser');

// Models
const User = require('./models/user');

// Database
const sequelize = require('./helpers/database');

// Template Engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Assets
app.use(express.static(path.join(__dirname, 'assets')));

// Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Routes
const login = require('./routes/login');

app.use('/login', login);

sequelize
    .sync()
    .then(result =>{
        //console.log(result);

        // Server Start
        app.listen(port, () => console.log(`Malha App em localhost:${port} ou <IP da máquina>:${port}`));
    })
    .catch(err =>{
        console.log(err);
    });