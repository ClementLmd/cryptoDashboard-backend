var express = require('express');
var router = express.Router();

const Wallet = require('../models/wallets');
const Crypto = require('../models/cryptos');
const User = require('../models/users');

const ETH_API_KEY="ZGJ85Q1912CX99S2A9JE6Q1VYPDVK9KC5S"

router.put('/contentWallet', (req, res) => {
    const { token } = req.body;
    User.findOne({ token })
        .populate("wallets")
        .then(user => {
            const wallets = user.wallets;
            const promises = wallets.map(wallet => {
                const { blockchain, address } = wallet;
                let cryptoName;
                if (blockchain === "Solana") {
                    cryptoName = "SOL";
                    const request = {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "getBalance",
                        "params": [address]
                    };
                    return fetch('https://api.mainnet-beta.solana.com', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(request),
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.error) {
                                throw new Error('adresse solana invalide');
                            }
                            if (data.result) {
                                const quantity = data.result.value / 1E9;
                                return Crypto.findOne({ name: cryptoName })
                                    .then(crypto => {
                                        if (!crypto) {
                                            throw new Error('token not found');
                                        }
                                        const cryptoId = crypto._id;
                                        return Wallet.updateOne(
                                            { address },
                                            { $set: { holdings: [] } }
                                        )
                                            .then(wallet => {
                                                if (wallet.modifiedCount > 0) {
                                                    console.log("wallet reinitialized");
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
                                                ).then(updated => {
                                                    if (updated.modifiedCount > 0) {
                                                        console.log("wallet updated");
                                                    }
                                                })
                                            });
                                    });
                            }
                        })
                        .catch(error => {
                            console.log(`erreur fetch api avec l'adresse ${address}: ${error.message}`)
                            return Promise.reject(new Error(`erreur fetch api avec l'adresse ${address}: ${error.message}`));
                        });
                } else if (blockchain === "Bitcoin") {
                    cryptoName = "BTC";
                    return fetch(`https://blockchain.info/rawaddr/${address}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.error) {
                                throw new Error('adresse bitcoin invalide');
                            }
                            if (data.final_balance) {
                                const quantity = data.final_balance / 1E8
                                return Crypto.findOne({ name: cryptoName })
                                    .then(crypto => {
                                        if (!crypto) {
                                            throw new Error('token not found');
                                        }
                                        const cryptoId = crypto._id;
                                        return Wallet.updateOne(
                                            { address },
                                            { $set: { holdings: [] } }
                                        )
                                            .then(wallet => {
                                                if (wallet.modifiedCount > 0) {
                                                    console.log("wallet reinitialized");
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
                                                ).then(updated => {
                                                    if (updated.modifiedCount > 0) {
                                                        console.log("wallet updated");
                                                    }
                                                })
                                            });
                                    });
                            }
                        })
                        .catch(error => {
                            console.log(`erreur fetch api avec l'adresse ${address}: ${error.message}`)
                            return Promise.reject(new Error(`erreur fetch api avec l'adresse ${address}: ${error.message}`));
                        });
                } else if (blockchain === "Ethereum") {
                    cryptoName = "ETH";
                    return fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${ETH_API_KEY}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.result) {
                                const quantity = data.result / 1E18
                                return Crypto.findOne({ name: cryptoName })
                                    .then(crypto => {
                                        if (!crypto) {
                                            throw new Error('token not found');
                                        }
                                        const cryptoId = crypto._id;
                                        return Wallet.updateOne(
                                            { address },
                                            { $set: { holdings: [] } }
                                        )
                                            .then(wallet => {
                                                if (wallet.modifiedCount > 0) {
                                                    console.log("wallet reinitialized");
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
                                                ).then(updated => {
                                                    if (updated.modifiedCount > 0) {
                                                        console.log("wallet updated");
                                                    }
                                                })
                                            });
                                    });
                            }
                        })
                }
                else {
                    console.log(`autre blockchain: ${blockchain}`)
                    return Promise.reject(new Error("autre blockchain"));
                }
            });

            Promise.allSettled(promises)
                .then(results => {
                    const successfulUpdates = results.filter(result => result.status === 'fulfilled');
                    const failedUpdates = results.filter(result => result.status === 'rejected');
                    res.json({ result: true, successfulUpdates, failedUpdates });
                })
        })
});

module.exports = router;
