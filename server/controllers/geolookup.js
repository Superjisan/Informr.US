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

	const statesPromise = new Promise(function(resolve, reject) {
		openstates.geoLookup(lat, lon, function(err, res) {
			if (err) reject(err);
			else resolve(res);
		});
	});

	const congressUrl = `https://congress.api.sunlightfoundation.com/legislators/locate?latitude=${lat}&longitude=${lon}&apikey=${apiKey}`;
	const congressPromise = rp(congressUrl)
		.then(body => JSON.parse(body).results);

	Promise.all([statesPromise, congressPromise])
		.then(results => {
			//fix va images for state
			results[0].forEach(rep => {
				if (rep.state === 'va') {
					if (rep.chamber === 'upper') {
						rep.photo_url = vaStateSenatorImages.images[rep.district - 1];
					} else {
						rep.photo_url = vaStateDelegatesImages.images[rep.district - 1];
					}
				}
			});

			// congress photo_url setting
			results[1].forEach(rep => {
				if(rep.chamber === 'house') {
					rep.photo_url = congressRepImages[rep.state][rep.district - 1];
				} else {
					const senateStateImages = congressSenatorImages[rep.state];
					const senatorImageUrl = _.find(senateStateImages, senator => _.includes(senator.url, rep.last_name));
					if (senatorImageUrl) {
						rep.photo_url = senatorImageUrl.url;
					}
				}
			});
			res.send(_.flatten(results));
		})
		.catch(err => {
			throw err;
		});
};
