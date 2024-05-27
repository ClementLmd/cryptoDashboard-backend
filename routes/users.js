var express = require('express');
var router = express.Router();

const User = require('../models/users');
const Wallet = require('../models/wallets');
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
            wallets: [],
            creationDate: Date.now(),
          });

          newUser.save().then(newDoc => {
            const { token, username, email, wallets } = newDoc
            res.json({ result: true, token, username, email, wallets });
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
      const { token, username, email, wallets } = data
      res.json({ result: true, token, username, email, wallets });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});

router.put('/:token/addWallet', (req, res) => {
  const token = req.params.token
  const walletAddress = req.body.address
  console.log("walletAddress:", walletAddress)

  Wallet.findOne({ address: walletAddress })
    .then(wallet => {
      console.log(wallet)
      if (!wallet) {
        console.log("wallet not found route put")
        return res.json({ result: false, error: 'Wallet not found' });
      }
      User.findOne({ token })
        .then(user => {
          console.log("user", user)
          if (!user) {
            return res.json({ result: false, error: 'User not found' });
          }
          User.updateOne(
            { _id: user._id },
            { $push: { wallets: wallet._id } }
          ).then(data => {
            if (data.modifiedCount > 0) {
              console.log("wallet added", data)
              res.json({ result: true });
            } else {
              console.log("erreur route put add wallet")
              res.json({ result: false, error: "error route put add wallet" })
            }
          });
        })
    })
})

router.put('/:token/removeWallet', (req, res) => {
  const token = req.params.token
  const walletAddress = req.body.address

  Wallet.findOne({ address: walletAddress })
    .then(wallet => {
      console.log(wallet)
      if (!wallet) {
        return res.json({ result: false, error: 'Wallet not found' });
      }
      User.findOne({ token })
        .then(user => {
          console.log("user", user)
          if (!user) {
            return res.json({ result: false, error: 'User not found' });
          }
          User.updateOne(
            { _id: user },
            { $pull: { wallets: wallet._id } }
          ).then(data => {
            if (data.modifiedCount > 0) {
              console.log("wallet added", data)
              res.json({ result: true });
            } else {
              console.log("erreur route put add wallet")
              res.json({ result: false, error: "error route put add wallet" })
            }
          });
        })
    })
})

module.exports = router;
