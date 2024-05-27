const mongoose = require('mongoose');

const holdingSchema = mongoose.Schema({
    crypto:{ type: mongoose.Schema.Types.ObjectId, ref: 'cryptos' },
    quantity: Number,
})

const walletSchema = mongoose.Schema({
    nameWallet: String,
    address: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    blockchain: String,
    holdings:[holdingSchema],
});

const Wallet = mongoose.model('wallets', walletSchema);

module.exports = Wallet;