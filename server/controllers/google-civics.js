const googleCivicsApiKey = process.env.GOOGLE_CIVICS_API_KEY;
const googleGeocodeApiKey = process.env.GOOGLE_GEOCODE_API_KEY;

const _ = require('lodash');

const requestToGCivics = async (options, res) => {
	try {
		response = await fetch(options.url)
		const data = await response.json()
		const result = [];
		for (let key in data.divisions) {

			data.divisions[key].offices = [];
			let officeIndices = data.divisions[key].officeIndices;
			if (!_.isEmpty(officeIndices)) {
				for (let i = 0; i < officeIndices.length; i++) {
					let officeIndex = data.divisions[key].officeIndices[i];
					let office = data.offices[officeIndex]
					let officialIndexes = office.officialIndices;
					data.divisions[key].offices.push(office);
					data.divisions[key].offices[i].officials = []
					for (let j = 0; j < officialIndexes.length; j++) {
						let officialIndex = officialIndexes[j];
						let official = data.officials[officialIndex];
						data.divisions[key].offices[i].officials.push(official);
					}
				}
			}
			result.push(data.divisions[key]);
		}
		await res.send(result.reverse());
	} catch (error) {
		console.error(error.message)
		await res.status(400).json({ message: error.message })
	}

}



module.exports = async (req, res) => {
	const { query } = req;
	if (!googleCivicsApiKey) await res.status(400).send({ message: 'google civics api key not set' });
	if (!googleGeocodeApiKey) await res.status(400).send({ message: 'google geocode api key not set' })
	if (query.latlng) {
		//make request to geocode api to get address
		const url = `https://geocode.googleapis.com/v4/geocode/location/${query.latlng}?key=${googleGeocodeApiKey}`
		try {
			const fetchResponse = await fetch(url)
			const data = await fetchResponse.json()
			const address = data.results[0].formattedAddress
			const options = {
				url: `https://www.googleapis.com/civicinfo/v2/representatives?key=${googleCivicsApiKey}&address=${address}`,
				json: true
			}
			await requestToGCivics(options, res)
		} catch (error) {

			console.error(error.message)
			await res.status(400).json({ message: error.message })
		}
	} else if (query.address) {
		//make request to civics api to get representatives
		const options = {
			url: `https://www.googleapis.com/civicinfo/v2/representatives?key=${googleCivicsApiKey}&address=${query.address}`,
			json: true
		}
		await requestToGCivics(options, res);
	} else {
		console.error('params not correct')
		await res.status(400).json({ message: 'params not correct' });
	}
}