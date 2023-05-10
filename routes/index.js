const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const { readData, writeData } = require('../filestorage');

const users = readData();

router.get('/', (req, res) => {
    res.render('index', { title: 'Página inicial' });
  });

  router.post('/login',passport.authenticate('local', {
      successRedirect: '/main',
      failureRedirect: '/',
      failureFlash: true,
    })
  );

router.get('/main', (req, res) => {    
    if (req.isAuthenticated()) {
        res.render('main');
      } else {
        res.redirect('/');
      }
});

router.get('/tarefa', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('tarefa');
      } else {
        res.redirect('/');
      }
});

router.get('/cadastro', (req, res) => {
    res.render('cadastro', { message: req.flash('error') });
  });
  
  router.get('/logout', (req, res) => {
    const successMessage = 'Você saiu da sua conta';
    req.session.destroy(err => {
      if (err) {
        console.log(err);
        return res.redirect('/main');
      }
      res.render('index', { message: null, success: successMessage });
    });
  });


  router.post('/cadastro', async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = {
        id: Date.now(),
        email: req.body.email,
        password: hashedPassword,
      };
      users.push(user);
      writeData(users);
      res.redirect('/');
    } catch (err) {
      req.flash('error', 'Ocorreu um erro ao tentar criar a conta');
      res.redirect('/cadastro');
    }
  });

module.exports = router;