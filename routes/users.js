var express = require('express');
var router = express.Router();

const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const bcrypt = require('bcrypt'); //cryptage mot de passe
const uid2 = require('uid2'); //création token utilisateur

router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['username', 'email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ username: { $regex: new RegExp(req.body.username, 'i') } }).then(data => { //est-ce que le username existe déjà ?
    if (data === null) {

      User.findOne({ email: { $regex: new RegExp(req.body.email, 'i') } }).then(data => { //est-ce que l'email existe déjà ?
        if (data === null) {
          const hash = bcrypt.hashSync(req.body.password, 10);

          const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hash,
            token: uid2(32),
          });

          newUser.save().then(newDoc => {
            res.json({ result: true, token: newDoc.token });
          });

        } else {
          res.json({ result: false, error: 'Email already exists' });
        }
      })

    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists' });
    }
  });
});

router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ username: req.body.username }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, username: data.username });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});

module.exports = router;
