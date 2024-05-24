var express = require('express');
var router = express.Router();

const Wallet = require('../models/wallets');
const Crypto = require('../models/cryptos');
const User = require('../models/users');

router.put('/contentWallet', (req, res) => {
    const { token } = req.body
    User.findOne({ token })
        .populate("wallets")
        .then(user => {
            // console.log("user:", user)
            const wallets = user.wallets
            const promises = wallets.map(wallet => {
                const { blockchain, address } = wallet
                if (blockchain === "Solana") {
                    const token = "SOL"
                    const request = {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "getBalance",
                        "params": [
                            address
                        ]
                    };
                    fetch('https://api.mainnet-beta.solana.com', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(request),
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data) {
                                console.log('data réponse fetch api', data);
                                const quantity = data.result.value / 1E9
                                return Crypto.findOne({ token })
                                    .then(crypto => {
                                        console.log("crypto : ", crypto)
                                        if (!crypto) {
                                            return console.log('Token not found');
                                        }
                                        const cryptoId = crypto._id
                                        return Wallet.updateOne(
                                            { address },
                                            {
                                                // $set: { "holdings.$.quantity": quantity }
                                                $set: { holdings: [] }
                                            }
                                        )
                                            .then(wallet => {
                                                if (wallet.modifiedCount > 0) {
                                                    console.log("wallet reinitialized")
                                                }
                                                return Wallet.updateOne(
                                                    { address },
                                                    {
                                                        $push: {
                                                            holdings: {
                                                                crypto: cryptoId,
                                                                quantity
                                                            }
                                                        }
                                                    }
                                                ).then(data => {
                                                    if (data.modifiedCount > 0) {
                                                        console.log(`data wallet ${wallet}`, data)
                                                    }
                                                    else {
                                                        console.log("erreur route put content wallet")
                                                    }
                                                });
                                            })
                                    })
                            }
                        })
                } else {
                    return Promise.reject(new Error("erreur fetch api solana"))
                }
            })
            Promise.allSettled(promises)
                .then(results => {
                    const successfulUpdates = results.filter(result => result.status === 'fulfilled');
                    const failedUpdates = results.filter(result => result.status === 'rejected');
                    res.json({ result: true, successfulUpdates, failedUpdates });
                })
        })
})

// router.put('/contentWallet', (req, res) => {
//     const { blockchain, address } = req.body
//     if (blockchain === "Solana") {
//         const token = "SOL"
//         const request = {
//             "jsonrpc": "2.0",
//             "id": 1,
//             "method": "getBalance",
//             "params": [
//                 address
//             ]
//         };
//         fetch('https://api.mainnet-beta.solana.com', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(request),
//         })
//             .then(response => response.json())
//             .then(data => {
//                 if (data) {
//                     console.log('data réponse fetch api', data);
//                     const quantity = data.result.value / 1E9
//                     Crypto.findOne({ token })
//                         .then(crypto => {
//                             console.log("crypto : ", crypto)
//                             if (!crypto) {
//                                 return res.json({ result: false, error: 'Token not found' });
//                             }
//                             const cryptoId = crypto._id
//                             Wallet.updateOne(
//                                 { address },
//                                 {
//                                     // $set: { "holdings.$.quantity": quantity }
//                                     $set: { holdings: [] }
//                                 }
//                             )
//                                 .then(wallet => {
//                                     if (wallet.modifiedCount > 0) {
//                                         console.log("wallet reinitialized")
//                                     }
//                                     Wallet.updateOne(
//                                         { address },
//                                         {
//                                             $push: {
//                                                 holdings: {
//                                                     crypto: cryptoId,
//                                                     quantity
//                                                 }
//                                             }
//                                         }
//                                     ).then(data => {
//                                         if (data.modifiedCount > 0) {
//                                             console.log("data", data)
//                                             res.json({ result: true, data })
//                                         }
//                                         else {
//                                             console.log("erreur route put content wallet")
//                                             res.json({ result: false, error: "error route put content wallet" })
//                                         }
//                                     });
//                                 })
//                         })
//                 }
//             })


//     } else res.json({ result: false, error: "erreur fetch api solana" })

// })


module.exports = router;
