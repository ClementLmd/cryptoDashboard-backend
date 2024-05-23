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
            creationDate: Date.now(),
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

router.put('/update', async (req, res) => {
  const { email, password } = req.body;

  // Vérifiez si au moins un champ est fourni
  if (!email &&!password) {
    return res.json({ result: false, error: 'At least one field must be provided' });
  }

  // Recherche de l'utilisateur par son token (exemple de critère d'identification)
  const user = await User.findOne({ token: req.headers.authorization.split(' ')[1] });

  if (!user) {
    return res.json({ result: false, error: 'User not found' });
  }

  let updateFields = {};

  // Construction de la requête de mise à jour
  if (email) updateFields.email = email;
  if (password) {
    // Hash le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    updateFields.password = hashedPassword;
  }

  // Appliquer les modifications
  Object.assign(user, updateFields);

  try {
    const savedUser = await user.save();
    res.json({ result: true, message: 'User information updated successfully', user: savedUser });
  } catch (err) {
    res.json({ result: false, error: 'Failed to update user information' });
  }
});


module.exports = router;
