const express = require('express');
const bodyParser = require('body-parser');
const router = require('./routes/route.js');
const mongoose = require('mongoose');
const app = express();
const multer = require("multer"); 

app.use(bodyParser.json());
app.use(multer().any()); 

mongoose.connect("mongodb+srv://harsh-developer:aA12345678@cluster0.lxbes.mongodb.net/Project-5_Product-Management?retryWrites=true&w=majority", {
  useNewUrlParser: true
})
  .then(() => console.log("MongoDb is connected"))
  .catch(err => console.log(err))


app.use('/', router);

app.all('/**', (req, res) => {
  res.status(404).send({ status: false, message: 'Page Not Found!' });
});

app.listen(process.env.PORT || 3000, function () {
  console.log('Express app running on port ' + (process.env.PORT || 3000));
});
