const mongoose = require('mongoose');

const cryptoSchema = mongoose.Schema({
    name: String,
    price: Number,
});

const Crypto = mongoose.model('cryptos', cryptoSchema);

module.exports = Crypto;