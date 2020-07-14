const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); 
const user = require('./models/userSchema.js');

app.use(express.static('public'))
app.use(bodyParser.json()); 

var mongoDB = 'mongodb://localhost/tokyodriftr';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true});
db = mongoose.connection;
db
  .on('error', console.error.bind(console, 'DB connection error.'))
  .once('open', console.log.bind(console, 'DB Connection established.'));

app.get('/res/:name', function (req, res, next) {
  console.log("dirname", path.join(__dirname, 'public'))
  var options = {
    root: path.join(__dirname, '../Assets'),
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }

  var fileName = req.params.name
  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err)
    } else {
      console.log('Sent:', fileName)
    }
  })
})

//When /newtime is posted to and has a valid json format
//Add the new user into the mongodb database
//Json information is inside of req.body
app.post('/newtime', function(req, res) {
  console.log(req.body)
  if(!req.body === undefined || !req.body.name === undefined || !req.body.time === undefined || req.body.course === undefined) {
    res.json({ statusCode: '400'})
    
  }
  else {
    var newUser = new user({name: req.body.name, time: req.body.time, course: req.body.course})
    newUser.save(function(err, user) {
      if (err) {
        res.json({err: err})
        return
      }

      console.log(user.name + " in collection with time: " + user.time);
      res.json({ statusCode: '200' })
    })
    
  }
})

//Finds all users in a particular course and sorts by lowest time
app.get('/alltimes/:course', function(req,res) {
  user.find({course:req.params.course}).sort('time').exec((err, users) => {
    res.json(users)
  });
})

app.listen(8080, () => console.log('starting server on port 8080'));
