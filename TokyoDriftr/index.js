const express = require('express');
const app = express();
const path = require('path');

app.use(express.static('public'))

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



app.listen(80, () => console.log('starting server on port 80'));
