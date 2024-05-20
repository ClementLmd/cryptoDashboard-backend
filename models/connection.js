const mongoose = require('mongoose');

// const connectionString = "mongodb+srv://clementlaumond:qJLgJUTyHWJ70bgy@cluster0.xx4c2xo.mongodb.net/cryptoDashboard"
const connectionString = process.env.CONNECTION_STRING;

mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log('Database connected'))
  .catch(error => console.error(error));
