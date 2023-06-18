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
const { JWT } = require('google-auth-library');
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

const jwtClient = new google.auth.JWT(
    process.env.CLIENT_EMAIL,
  null,
    process.env.PRIVATE_KEY,
  SCOPES
);

const calendar = google.calendar({
  version: "v3",
  project: process.env.PROJECT_ID,
  auth: jwtClient,
});

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

// Função para inicializar a biblioteca do Google Calendar API
function initClient() {
  gapi.client.init({
    clientId: process.env.GOOGLE_CLIENT_ID,
    private_key: process.env.PRIVATE_KEY,
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    scope: 'https://www.googleapis.com/auth/calendar.events'
  }).then(function () {
    // Adiciona um listener para o evento de submit do formulário
    document.getElementById('event-form').addEventListener('submit', createEvent);
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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo deu errado!");
});

module.exports = app;
