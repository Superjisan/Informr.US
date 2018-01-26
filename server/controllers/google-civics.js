const googleCivicsApiKey = process.env.GOOGLE_CIVICS_API_KEY;
const googleGeocodeApiKey = process.env.GOOGLE_GEOCODE_API_KEY;

const _ = require('lodash');
const rp = require('request-promise');

const requestToGCivics = (options, res) => {
	rp(options)
		.then(data => {
			//go through data.divisions
			const result = [];
			for (let key in data.divisions) {

				data.divisions[key].offices = [];
				let officeIndices = data.divisions[key].officeIndices;
				for(let i = 0; i < officeIndices.length; i++) {
					let officeIndex = data.divisions[key].officeIndices[i];
					let office = data.offices[officeIndex]
					let officialIndexes = office.officialIndices;
					data.divisions[key].offices.push(office);
					data.divisions[key].offices[i].officials = []
					for(let j = 0; j < officialIndexes.length; j++) {
						let officialIndex = officialIndexes[j];
						let official = data.officials[officialIndex];
						data.divisions[key].offices[i].officials.push(official);
					}
				}
				result.push(data.divisions[key]);
			}

			res.send(result.reverse());
		})
		.catch(err => res.status(400).send(err));
}



module.exports = (req, res) => {
	const {query} = req;
	if(!googleCivicsApiKey) return res.status(400).send({message: 'google civics api key not set'});
	if (query.latlng) {
		//make request to geocode api
		const geocodeOptions = {
			uri: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${query.latlng}&key=${googleGeocodeApiKey}`,
			json: true
		}
		rp(geocodeOptions)
			.then(data => {
				const address = data.results[0].formatted_address;
				const options = {
					uri: `https://www.googleapis.com/civicinfo/v2/representatives?key=${googleCivicsApiKey}&address=${address}`,
					json: true
				}
				requestToGCivics(options, res);
			})
			.catch(err => {
				res.status(400).send(err)
			})
	} else if(query.address) {
		const options = {
			uri: `https://www.googleapis.com/civicinfo/v2/representatives?key=${googleCivicsApiKey}&address=${query.address}`,
			json: true
		}
		requestToGCivics(options, res);
	} else {
		res.status(400).send({message: 'params not correct'});
	}	
}