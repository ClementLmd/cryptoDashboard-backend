const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    email: String,
    token: String,
    wallets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'wallets' }],
    totalValue: [{
        value: Number,
        date: Date,
    }],
    creationDate: Date,
});

const User = mongoose.model('users', userSchema);

module.exports = User;