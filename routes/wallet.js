var express = require('express');
var router = express.Router();

const Wallet = require('../models/wallets');

router.post('/', (req, res) => {
    const { nameWallet, address, blockchain, user } = req.body

    Wallet.findOne({ address, user }).then(data => {
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
});

router.get('/', (req, res) => {
    Wallet.find({ user: req.body.user })
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

module.exports = router;
