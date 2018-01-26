const apiKey = process.env.OPEN_STATES_API_KEY || 'jzaman@wesleyan.edu';

const _ = require('lodash');
const OpenStates = require('openstates');
const openstates = new OpenStates(apiKey);
const Promise = require('promise');
const rp = require('request-promise');

module.exports = (req, res) => {
	const lat = req.params.lat;
	const lon = req.params.lon;

	const statesPromise = new Promise((resolve, reject) => {
		openstates.geoLookup(lat, lon, (err, res) => {
			if (err) {
				console.error(err);
				reject(err);
			} else { 
				resolve(res) 
			};
		});
	});

	statesPromise
		.then(results => res.send(results))
		.catch(err => res.status(400).send(err));
};
