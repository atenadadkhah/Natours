const mongoose = require('mongoose')
const dotenv = require('dotenv')
const app = require('./app')
process.on('uncaughtException', err => {
  console.log('Uncaught Exception...');
  console.log(err);
})

dotenv.config({path : './config.env'})

const DB = process.env.DB.replace(
  '<PASSWORD>',
  process.env.DB_PASSWORD
)

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(() => console.log('DB connection successful'))


const server = app.listen(process.env.PORT || 3000, () =>{
  console.log('App is running');
})

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection...');
  server.close(() => {
    process.exit(1)
  })
})


