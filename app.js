if (!process.env.GOOGLE_CIVICS_API_KEY) {
	require('dotenv').config();
}

const _ = require("lodash");
const express = require('express');
const googleCivicsLookup = require('./server/controllers/google-civics.js');
let PLATFORMSH_CONFIG = null;
if (process.env.PLATFORM_PROJECT) {
	PLATFORMSH_CONFIG = require("platformsh").config();
}

var app = express();
//Redirect to https site
app.use(function (req, res, next) {
	if (!PLATFORMSH_CONFIG && process.env.PORT && req.headers['x-forwarded-proto'] !== 'https') {
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
const PORT = process.env.PORT || _.get(PLATFORMSH_CONFIG, 'port') || 3002;
app.listen(PORT, () => {
	console.log(`Server started at ${PORT}`);
});

