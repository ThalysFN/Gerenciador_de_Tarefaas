const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const path = require('path');
const app = express();
const routes = require('./routes/index');

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'mySecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

const { readData, writeData } = require('./filestorage');
const users = readData();

passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      const user = users.find((user) => user.email === email);
      if (!user) {
        return done(null, false, { messagedeerr: 'Usuário não encontrado' });
      }
  
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { messagedeerr: 'Senha incorreta' });
        }
      });
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = users.find((user) => user.id === id);
    done(null, user);
  });

app.set('views', path.join(__dirname, 'views'));
app.use('/', routes);
app.use('/main', routes);
app.use('/tarefa', routes);
app.use('/cadastro', routes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

module.exports = app;