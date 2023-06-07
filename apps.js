require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const { google } = require("googleapis");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const expressSession = require("express-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const path = require("path");
const app = express();
const routes = require("./routes/index");
var userProfile;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));
// Configure a sessão
app.use(expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(session({
  
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Configuração do Passport
passport.use(new GoogleStrategy({
    scope: ['profile', 'email'],
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, cb) {
      userProfile=profile;
      return cb(null, userProfile);
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
// Crie um cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL
);

// Defina os escopos que precisamos acessar
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

app.get('/', function(req, res) {
  res.render('views/index');
});
app.get('/success', (req, res) => {
  if (userProfile) {  // Verifique se o usuário está autenticado
    res.render('views/main', { user: userProfile });  // Renderiza a view 'success' e passa o perfil do usuário
  } else {
    res.redirect('/');  // Se o usuário não estiver autenticado, redireciona para a página inicial
  }
});

//app.get('/main', (req, res) => res.send(userProfile));
app.get('/error', (req, res) => res.send("error logging in"));

app.get('/auth/google', 
  passport.authenticate('google', { scope : ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'] }));
 
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/success');
  });
// Rotas
app.get('/calendar', (req, res) => {
  if (!req.user) {
    // Se o usuário não estiver autenticado, redireciona para a página inicial
    res.redirect('/');
  } else {
    // Usando as credenciais do usuário para acessar a API do Google Calendar
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.CALLBACK_URL
    );
    oauth2Client.setCredentials({
      access_token: req.user.accessToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    calendar.events.list({
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, (err, result) => {
      if (err) return console.log('The API returned an error: ' + err);
      const events = result.data.items;
      if (events.length) {
        res.render('calendar', { events });  // Renderiza a página 'calendar' e passa os eventos
      } else {
        console.log('No upcoming events found.');
      }
    });
  }
});



app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({ secret: "mySecret", resave: false, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

const {
  readData,
  writeData,
  findUserByEmail,
  findUserById,
} = require("./filestorage");
const users = readData();

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await findUserByEmail(email); // Use a função findUserByEmail aqui
        if (!user) {
          return done(null, false, { message: "Usuário não encontrado" });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Senha incorreta" });
          }
        });
      } catch (err) {
        console.error(err);
        return done(err);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id); // Use a função findUserById aqui
    done(null, user);
  } catch (err) {
    console.error(err);
    done(err, null);
  }
});

app.set("views", path.join(__dirname, "views"));
app.use("/", routes);
app.use("/main", routes);
app.use("/tarefa", routes);
app.use("/cadastro", routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo deu errado!");
});

module.exports = app;
