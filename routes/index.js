const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcrypt");
const { JWT } = google.auth;
require('dotenv').config();
const { google } = require ("googleapis")
const { readData, writeData } = require("../filestorage");
const { JWT } = require('google-auth-library');
const { GoogleApis } = require("googleapis");
let users = [];

// Carregar os dados dos usuários do MongoDB
async function loadUsers() {
  try {
    users = await readData();
  } catch (err) {
    console.error("Erro ao ler dados do MongoDB:", err);
  }
}

loadUsers();

router.get("/", (req, res) => {
  res.render("index", { title: "Página inicial" });
});
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/main",
    failureRedirect: "/",
    failureFlash: true,
  })
);

router.get("/main", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("main");
  } else {
    res.redirect("/");
  }
});

router.get("/criartarefa", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("criartarefa");
  } else {
    res.redirect("/");
  }
});

router.get("/tarefa", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("tarefa");
  } else {
    res.redirect("/");
  }
});

router.get("/cadastro", (req, res) => {
  res.render("cadastro", { message: req.flash("error") });
});

router.get("/logout", (req, res) => {
  const successMessage = "Você saiu da sua conta";
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.redirect("/main");
    }
    res.render("index", { message: null, success: successMessage });
  });
});

router.post("/cadastro", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      id: Date.now(),
      email: req.body.email,
      password: hashedPassword,
    };
    users.push(user);
    // Aguarde a conclusão da função writeData antes de redirecionar
    await writeData(users);
    res.redirect("/");
  } catch (err) {
    console.error(err); // Adicione esta linha para ver o erro no console, se houver algum
    req.flash("error", "Ocorreu um erro ao tentar criar a conta");
    res.redirect("/cadastro");
  }
});

router.get("/", function (req, res) {
  res.render("views/index");
});
router.get("/main", (req, res) => {
  if (userProfile) {
    // Verifique se o usuário está autenticado
    res.render("views/main", { user: userProfile }); // Renderiza a view 'success' e passa o perfil do usuário
  } else {
    res.redirect("/"); // Se o usuário não estiver autenticado, redireciona para a página inicial
  }
});

//app.get('/main', (req, res) => res.send(userProfile));
router.get("/error", (req, res) => res.send("error logging in"));

router.get(
  "/index/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/error" }),
  function (req, res) {
    // Successful authentication, redirect success.
    res.redirect("/main");
  }
);
// Rotas
router.get("/criartarefa", (req, res) => {
  if (!req.user) {
    // Se o usuário não estiver autenticado, redireciona para a página inicial
    res.redirect("/");
  } else {
    // Usando as credenciais do usuário para acessar a API do Google Calendar
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.CALLBACK_URL,
      process.env.PRIVATE_KEY,
      process.env.CALENDAR_ID
    );
    oauth2Client.setCredentials({
      access_token: req.user.accessToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    calendar.events.list(
      {
        calendarId: process.env.CALENDAR_ID,
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
      },
      (err, result) => {
        if (err) return console.log("The API returned an error: " + err);
        const events = result.data.items;
        if (events.length) {
          res.render("criartarefa", { events }); // Renderiza a página 'calendar' e passa os eventos
        } else {
          console.log("No upcoming events found.");
        }
      }
    );
  }
});

router.post('/creatEvent', (req, res) => {
  // Extrair os dados do formulário
  const { eventTitle, eventStart, eventEnd, eventDescription } = req.body;

  // Criar objeto de evento
  const event = {
    summary: eventTitle,
    start: {
      dateTime: eventStart,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: eventEnd,
      timeZone: 'America/New_York',
    },
    description: eventDescription,
  };
  // Fazer a autenticação e criar o evento no calendário
  const jwtClient = new JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  
  jwtClient.authorize((err, tokens) => {
    if (err) {
      console.error('Erro na autenticação:', err);
      return;
    }

    calendar.events.insert(
      {
        auth: jwtClient,
        calendarId: process.env.CALENDAR_ID, // Use o ID do calendário correto
        resource: event,
      },
      (err, event) => {
        if (err) {
          console.error('Erro ao criar evento:', err);
          res.send('Erro ao criar evento.');
        } else {
          console.log('Evento criado:', event.data);
          res.send('Evento criado com sucesso!');
        }
      }
    );
  });
});


module.exports = router;