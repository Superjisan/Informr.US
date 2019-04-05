if (!process.env.GOOGLE_CIVICS_API_KEY) {
	require('dotenv').config();
}

const express = require('express');
const googleCivicsLookup = require('./server/controllers/google-civics.js');

var app = express();
//Redirect to https site
app.use(function (req, res, next) {
	if (process.env.PORT && req.headers['x-forwarded-proto'] !== 'https') {
		//needed for heroku redirects
		res.redirect('https://informr.us' + req.url);
	} else {
		next();
	}
});
app.use(express.static('src'));
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.render('index.html');
});

app.get('/address-lookup', googleCivicsLookup);

app.listen(process.env.PORT || 3002, () => {
	/* eslint-disable no-console */
	console.log(`Server started at ${process.env.PORT || 3002}`);
});

