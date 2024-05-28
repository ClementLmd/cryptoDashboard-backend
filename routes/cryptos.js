var express = require('express');
var router = express.Router();

const Wallet = require('../models/wallets');
const Crypto = require('../models/cryptos');
const User = require('../models/users');

const ETH_API_KEY = process.env.ETH_API_KEY

router.put('/contentWallet/:token', (req, res) => {
    const { token } = req.params;
    // recherche de l'utilisateur via son token
    User.findOne({ token })
        .populate("wallets")
        .then(user => {
            // on va faire un .map sur le tableau des wallets de l'utilisateur
            const wallets = user.wallets;
            // on utilise les promesses car on va mapper en asynchrone sur chaque wallet, même en cas d'erreur lors du fetch
            // dans notre cas, on fait une requête à l'api selon la blockchain et on attend la réponse
            // si on a la réponse attendue (= le solde du wallet), on met à jour le tableau holdings
            // si l'api renvoie une erreur, la promesse sera alors "rejected" mais cela n'interrompera pas les requêtes suivantes
            const promises = wallets.map(wallet => {
                const { blockchain, address } = wallet;
                let cryptoName;
                // on fait une requête à une api différente selon la blockchain donc un if par blockchain
                if (blockchain === "Solana") {
                    cryptoName = "SOL";
                    // l'api pour solana veut une requête sous ce format :
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
                            // si l'api renvoie une erreur, on créé une erreur qui s'ajoutera au tableau des promesses "rejected"
                            if (data.error) {
                                throw new Error('adresse solana invalide');
                            }
                            // si l'api renvoie un result, on peut passer à la mise à jour du tableau holdings
                            if (data.result) {
                                // la value reçue est en lamports (fraction d'un SOL) donc on remet la valeur en SOL
                                const quantity = data.result.value / 1E9;
                                // on recherche dans la bdd le token correspondant
                                return Crypto.findOne({ name: cryptoName })
                                    .then(crypto => {
                                        if (!crypto) {
                                            throw new Error('token not found');
                                        }
                                        // on alimente le tableau holdings avec une clé étrangère donc on a besoin de l'id de la crypto
                                        const cryptoId = crypto._id;
                                        // on fait un updateMany car le wallet peut être ajouté par plusieurs utilisateurs mais son contenu est le même partout
                                        // on réinitialise le contenu de holdings car on va l'alimenter avec son contenu au moment de la requête
                                        return Wallet.updateMany(
                                            { address },
                                            { $set: { holdings: [] } }
                                        )
                                            .then(wallet => {
                                                if (wallet.modifiedCount > 0) {
                                                    console.log("wallet reinitialized");
                                                }
                                                // on alimente le wallet avec la quantité fournie par l'api et la clé étrangère de la crypto correspondante
                                                return Wallet.updateMany(
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
                                                        console.log(`wallet updated : ${address}`);
                                                    }
                                                })
                                            });
                                    });
                            }
                        })
                        // si l'api renvoie une erreur, la promesse est alors "rejected"
                        .catch(error => {
                            console.log(`erreur fetch api avec l'adresse ${address}: ${error.message}`)
                            return Promise.reject(new Error(`erreur fetch api avec l'adresse ${address}: ${error.message}`));
                        });
                } else if (blockchain === "Bitcoin") {
                    cryptoName = "BTC";
                    return fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`)
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
                                        return Wallet.updateMany(
                                            { address },
                                            { $set: { holdings: [] } }
                                        )
                                            .then(wallet => {
                                                if (wallet.modifiedCount > 0) {
                                                    console.log("wallet reinitialized");
                                                }
                                                return Wallet.updateMany(
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
                                                        console.log(`wallet updated : ${address}`);
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
                                        return Wallet.updateMany(
                                            { address },
                                            { $set: { holdings: [] } }
                                        )
                                            .then(wallet => {
                                                if (wallet.modifiedCount > 0) {
                                                    console.log("wallet reinitialized");
                                                }
                                                return Wallet.updateMany(
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
                                                        console.log(`wallet updated : ${address}`);
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

            // on attend que toutes les promesses soient soit "rejected" soit réalisées pour faire le res.json, sinon le backend crash
            // la réponse du backend a un result true, un tableau avec les promesses réalisées et un tableau avec les promesses "rejected"
            Promise.allSettled(promises)
                .then(results => {
                    const successfulUpdates = results.filter(result => result.status === 'fulfilled');
                    const failedUpdates = results.filter(result => result.status === 'rejected');
                    res.json({ result: true, successfulUpdates, failedUpdates });
                })
        })
});

router.post('/price', (req, res) => {
    fetch('https://api.coincap.io/v2/assets')
        .then(response => response.json())
        .then(dataApi => {
            dataApi.data.forEach(async asset => {
                const existingCrypto = await Crypto.findOne({ name: asset.symbol })

                if (existingCrypto === null) {
                    const newCrypto = new Crypto({
                        name: asset.symbol,
                        price: asset.priceUsd
                    });
                    await newCrypto.save()
                } else {
                    const currentPrice = parseFloat(existingCrypto.price);
                    const newPrice = parseFloat(asset.priceUsd);

                    if (currentPrice !== newPrice) {
                        const updateResult = await Crypto.updateOne(
                            { name: asset.symbol },
                            { $set: { price: asset.priceUsd } }
                        )
                        if (updateResult.modifiedCount > 0) {
                            console.log(`Updated crypto: ${asset.symbol} with new price ${asset.priceUsd}`);
                        } else {
                            console.log(`Crypto ${asset.symbol} found but not updated. Maybe the price was the same.`);
                        }
                    } else {
                        console.log(`Crypto ${asset.symbol} already has the same price: ${asset.priceUsd}`);
                    }
                }
            })
            res.json({ result: true })
        })
})


module.exports = router;
