const mongoose = require('mongoose');

const connectionString = "mongodb+srv://lamartitarek:GyPdhKZHehDHrgvk@cluster0.pjurict.mongodb.net/cryptoDashboard"
// const connectionString = process.env.CONNECTION_STRING;

mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log('Database connected'))
  .catch(error => console.error(error));
