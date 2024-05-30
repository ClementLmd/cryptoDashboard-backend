var express = require("express");
var router = express.Router();

const User = require("../models/users");
const Wallet = require("../models/wallets");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt"); //cryptage mot de passe
const uid2 = require("uid2"); //création token utilisateur

router.post("/signup", (req, res) => {
  // vérification que les champs requis sont présents
  if (!checkBody(req.body, ["username", "email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({
    username: { $regex: new RegExp(req.body.username, "i") },
  }).then((data) => {
    //est-ce que le username existe déjà ?
    if (data === null) {
      User.findOne({ email: { $regex: new RegExp(req.body.email, "i") } }).then(
        (data) => {
          //est-ce que l'email existe déjà ?
          if (data === null) {
            // hachage du mot de passe
            const hash = bcrypt.hashSync(req.body.password, 10);

            // création d'un nouvel utilisateur
            const newUser = new User({
              username: req.body.username,
              email: req.body.email,
              password: hash,
              token: uid2(32),
              wallets: [],
              creationDate: Date.now(),
            });

            newUser.save().then((newDoc) => {
              const { token, username, email, wallets, totalValue } = newDoc;
              res.json({
                result: true,
                token,
                username,
                email,
                wallets,
                totalValue,
              });
            });
          } else {
            res.json({ result: false, error: "Email already exists" });
          }
        }
      );
    } else {
      res.json({ result: false, error: "User already exists" });
    }
  });
});

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  // recherche de l'utilisateur par son username
  User.findOne({ username: req.body.username }).then((data) => {
    // vérification du mot de passe
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      const { token, username, email, wallets, totalValue } = data;
      res.json({ result: true, token, username, email, wallets, totalValue });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

router.put("/update/:token", async (req, res) => {
  const { email, password } = req.body;
  const token = req.params.token;
  console.log("req body", req.body);
  // Vérifiez si au moins un champ est fourni
  if (!email && !password) {
    return res.json({
      result: false,
      error: "At least one field must be provided",
    });
  }

  // Recherche de l'utilisateur par son token (exemple de critère d'identification)
  const user = await User.findOne({ token });

  if (!user) {
    return res.json({ result: false, error: "User not found" });
  }

  let updateFields = {};

  // Construction de la requête de mise à jour
  if (email !== user.email) updateFields.email = email;
  if (password !== "") {
    // Hash le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    updateFields.password = hashedPassword;
  }

  // Appliquer les modifications
  Object.assign(user, updateFields);

  try {
    const savedUser = await user.save();
    res.json({
      result: true,
      message: "User information updated successfully",
      email: savedUser.email,
    });
  } catch (err) {
    res.json({ result: false, error: "Failed to update user information" });
  }
});

router.put("/:token/addWallet", (req, res) => {
  const token = req.params.token;
  const walletAddress = req.body.address;
  console.log("walletAddress:", walletAddress);

  // recherche du portefeuille par son adresse
  Wallet.findOne({ address: walletAddress }).then((wallet) => {
    console.log(wallet);
    if (!wallet) {
      console.log("wallet not found route put");
      return res.json({ result: false, error: "Wallet not found" });
    }
    // recherche de l'utilisateur par son token
    User.findOne({ token }).then((user) => {
      console.log("user", user);
      if (!user) {
        return res.json({ result: false, error: "User not found" });
      }
      // ajout de l'identifiant du portefeuille à la liste des portefeuilles de l'utilisateur
      User.updateOne(
        { _id: user._id },
        { $push: { wallets: wallet._id } }
      ).then((data) => {
        if (data.modifiedCount > 0) {
          console.log("wallet added", data);
          res.json({ result: true });
        } else {
          console.log("erreur route put add wallet");
          res.json({ result: false, error: "error route put add wallet" });
        }
      });
    });
  });
});

router.put("/:token/removeWallet", (req, res) => {
  const token = req.params.token;
  const walletAddress = req.body.address;

  Wallet.findOne({ address: walletAddress }).then((wallet) => {
    console.log(wallet);
    if (!wallet) {
      return res.json({ result: false, error: "Wallet not found" });
    }
    User.findOne({ token }).then((user) => {
      console.log("user", user);
      if (!user) {
        return res.json({ result: false, error: "User not found" });
      }
      // suppression de l'identifiant du portefeuille de la liste des portefeuilles de l'utilisateur
      User.updateOne({ _id: user }, { $pull: { wallets: wallet._id } }).then(
        (data) => {
          if (data.modifiedCount > 0) {
            console.log("wallet added", data);
            res.json({ result: true });
          } else {
            console.log("erreur route put add wallet");
            res.json({ result: false, error: "error route put add wallet" });
          }
        }
      );
    });
  });
});

router.put("/:token/updateTotalValue", (req, res) => {
  const token = req.params.token;
  const { totalValue } = req.body;
  const date = Date.now();
  console.log("date:", date);

  User.findOne({ token }).then((user) => {
    if (!user) {
      return res.json({ result: false, error: "User not found" });
    }
    const lastValue = user.totalValue[user.totalValue.length - 1];
    console.log("last value:", lastValue);

    User.updateOne(
      { token },
      {
        $push: {
          totalValue: {
            value: totalValue,
            date,
          },
        },
      }
    ).then((data) => {
      if (data.modifiedCount > 0) {
        console.log("totalValue added", data);
        res.json({ result: true });
      } else {
        console.log("erreur ajout totalValue");
        res.json({ result: false, error: "erreur ajout totalValue" });
      }
    });
  });
});

module.exports = router;
