var express = require('express');
var router = express.Router();

const Wallet = require('../models/wallets');
const User = require('../models/users');

router.post('/', (req, res) => {
    const { nameWallet, address, blockchain, user } = req.body
    console.log("req.body", req.body)
    User.findOne({ token: user })
        .then(user => {
            console.log("user", user)
            if (!user) {
                return res.json({ result: false, error: 'User not found' });
            }

            Wallet.findOne({ address, user })
                .populate('user').then(data => {
                    console.log("data route post", data)
                    if (data === null) {

                        const newWallet = new Wallet({
                            nameWallet,
                            address,
                            blockchain,
                            user,
                        });

                        newWallet.save().then(newDoc => {
                            res.json({ result: true, newDoc });
                        });

                    } else {
                        res.json({ result: false, error: 'Wallet already exists' });
                    }
                })
        })

});

router.get('/:token', (req, res) => {
    const token = req.params.token;
    User.findOne({ token })
        .then(user => {
            console.log("user", user)
            if (!user) {
                return res.json({ result: false, error: 'User not found' });
            }

            Wallet.find({ user: user._id })
                .populate('user')
                .then(listWallets => {
                    if (listWallets) {
                        console.log("liste des wallets d'un user:", listWallets)
                        res.json({ result: true, listWallets })
                    }
                    else {
                        res.json({ result: false, error: "This user has no wallets" })
                    }
                })
        })
})

router.delete('/', (req, res) => {
    Wallet.findOne({ address: req.body.address })
        .then(data => {
            if (data) {
                Wallet.deleteOne({ _id: data._id })
                    .then(data => {
                        console.log(data)
                        if (data.deletedCount > 0)
                            res.json({ result: true });
                        else res.json({ result: false, error: "Wallet not deleted" });
                    });
            } else res.json({ result: false, error: "Wallet not found" });
        })

});

module.exports = router;
