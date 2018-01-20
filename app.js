if (!process.env.OPEN_STATES_API_KEY) {
	require('dotenv').config();
}
const googleCivicsApiKey = process.env.GOOGLE_CIVICS_API_KEY;

const Promise = require('promise');
const rp = require('request-promise');
const express = require('express');
const heroku = require('heroku-ping');

const geolookup = require('./server/controllers/geolookup.js');

var app = express();
//Redirect to https site
app.use(function(req,res,next) {
	if (process.env.PORT && req.headers['x-forwarded-proto'] !== 'https') {
		//needed for heroku redirects
		res.redirect('https://informr.us'+req.url);
	} else {
		next();
	}
});
app.use(express.static('src'));
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.render('index.html');
});

app.get('/geolookup/:lat/:lon', geolookup);

app.get('/address-lookup', (req, res) => {
	const {query} = req;
	// console.log('address', req);
	const options = {
		uri: `https://www.googleapis.com/civicinfo/v2/representatives?key=${googleCivicsApiKey}&address=${query.address}`,
		json: true
	}
	rp(options)
		.then(data => {
			console.log('data', data);
			res.send(data);
		})
		.catch(err => res.status(400).send(err));
});

app.listen(process.env.PORT || 3002, () => {
	/* eslint-disable no-console */
	console.log(`Server started at ${process.env.PORT || 3002}`);
});

//ONLY do this on prod
if (process.env.PORT) {
	heroku.ping({
		silent: false,       // logging (default: false)
		apps: [{
			name: 'inform-r-us', // heroku app name - required
			secure: true      // requires https (defaults: false)
		}]
	});
}
