const _ = require('lodash');
const OpenStates = require('openstates');
const express = require('express');

const apiKey = process.env.OPEN_STATES_API_KEY;
var openstates = new OpenStates(apiKey);



var app = express();
app.use(express.static('src'));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index.html')
});

app.get('/geolookup/:lat/:lon', (req, res) => {
    console.log('req.params', req.params);
    openstates.geoLookup(req.params.lat,req.params.lon, function(err, json) {
      if (err) throw err;
      console.log(json);
      res.send(json);
    });
});

app.listen(3002, () => {
     console.log("Server started at localhost:3002")
});

