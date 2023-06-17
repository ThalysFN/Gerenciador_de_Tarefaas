require('coffee-script/register');
require("dotenv").config();
const express = require("express");
const gapi = require("gapi")
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
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);


app.use(passport.session());

// Configuração do Passport
passport.use(
  new GoogleStrategy(
    {
      client_email:process.env.CLIENT_EMAIL,
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      private_key: process.env.PRIVATE_KEY,
      project_number: process.env.PROJECT_ID,
      scope: ["profile" + "email"]
    },
    function (accessToken, refreshToken, profile, cb) {
      userProfile = profile;
      return cb(null, userProfile);
    }
  )
);
// Defina os escopos que precisamos acessar
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

const auth = new google.auth.GoogleAuth({
  key: process.env.PRIVATE_KEY,
  scopes: SCOPES,
});

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
// Crie um cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL
);

// Função para carregar a biblioteca do Google Calendar API
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

// Função para criar evento no Google Calendar
function createEvent(eventTitle, eventStart, eventEnd, eventDescription) {
  var event = {
    'summary': eventTitle,
    'start': {
      'dateTime': eventStart
    },
    'end': {
      'dateTime': eventEnd
    },
    'description': eventDescription
  };

  gapi.client.calendar.events.insert({
    'calendarId': 'primary',
    'resource': event
  }).then(function (response) {
    console.log('Evento criado: ', response);
    alert('Evento criado com sucesso!');
  }, function (error) {
    console.error('Erro ao criar evento: ', error);
    alert('Erro ao criar evento. Verifique o console para mais informações.');
  });
}
function getURLParameters(url) {
  var params = {};
  var paramString = url.split('?')[1];
  if (paramString) {
    var paramPairs = paramString.split('&');
    paramPairs.forEach(function (pair) {
      var param = pair.split('=');
      params[param[0]] = decodeURIComponent(param[1]);
    });
  }
  return params;
}

// Função para inicializar a biblioteca do Google Calendar API
function initClient() {
  gapi.client.init({
    private_key: "AIzaSyCCtHbadqRjVUiOhGLKS-7doD6zkoFHvEk" ,
    clientId: "801538061580-sg0a8iku9leddfh1v2c0c3at4jvf6sda.apps.googleusercontent.com",
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    scope: 'https://www.googleapis.com/auth/calendar.events'
  }).then(function () {
    // Extrai parâmetros da URL
    var urlParams = getURLParameters(window.location.href);
    var eventTitle = urlParams['event-title'];
    var eventStart = urlParams['event-start'];
    var eventEnd = urlParams['event-end'];
    var eventDescription = urlParams['event-description'];

    if (window.location.href.startsWith(expectedURL)) {
      // Cria o evento no Google Calendar com os dados da URL
      createEvent(eventTitle, eventStart, eventEnd, eventDescription);
    } else {
      console.log('A página foi carregada de uma URL diferente. A criação de eventos não será executada.');
    }
  });
    
}

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
app.use("/criartarefa",routes);
app.use("/criarEvento",routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo deu errado!");
});

module.exports = app;
