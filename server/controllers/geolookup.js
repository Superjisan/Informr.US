const apiKey = process.env.OPEN_STATES_API_KEY || 'jzaman@wesleyan.edu';

const _ = require('lodash');
const OpenStates = require('openstates');
const openstates = new OpenStates(apiKey);
const Promise = require('promise');
const rp = require('request-promise');

const congressRepImages = require('../../state-json-data/states_rep_images.json');
const congressSenatorImages = require('../../state-json-data/states_senators_images.json');
const vaStateSenatorImages = require('../../state-json-data/va_state_senate_images.json');
const vaStateDelegatesImages = require('../../state-json-data/va_state_house_images.json');

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
