$(document).ready(() => {
	$('#findButton').click(setPinOnMap);
	$('#findRepGoogleCivics').click(getGCivicsRepresentation);

	if (!("geolocation" in navigator)) {
		$('#findLocationLeg').addClass('hidden');
	} else {
	/* geolocation IS available */
		$('#findLocationLeg').click(() => {
			resetResults();
			$('.loading-img').removeClass('hidden');
			navigator.geolocation.getCurrentPosition(position => {
				$('.loading-img').addClass('hidden');
				let location = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};
				renderMapWithLocation(location);
				getReps(location);
				getRepsGCivicsForLocation(location);
			});
		});
	}
});

const jqueryFieldSelectors = ['#address1', '#city', '#state', '#zipcode'];

const validateAddress = () => {
	var hasError = false;

	for (let i = 0; i < jqueryFieldSelectors.length; i++) {
		let jQueryField = $(jqueryFieldSelectors[i]);
		if (!jQueryField.val()) {
			jQueryField.parent().addClass('has-error');
			hasError = true;
		} else {
			jQueryField.parent().removeClass('has-error');
		}
	}

	if (hasError) {
		$('.address-error').removeClass('hidden');
	} else {
		$('.address-error').addClass('hidden');

		var address = $('#address1').val() + ' ' + $('#city').val() + ' ' + $('#state').val() + $('#zipcode').val();
		return address;
	}
};

const resetResults = () => {
	resetAddressFields();
	$('.row.results').empty();
	$('.state-legislators-panels').empty();
	$('.congress-legislators-panels').empty();
};

const resetAddressFields = () => {
	jqueryFieldSelectors.forEach(field => $(field).val(''));
}

generateForOfficials = (officials) => {
	let html = ''
	officials.forEach(official => {
		let imgHtml = ``;
		if(official.photoUrl) {
			imgHtml = `<div class="legislator-img-col col-xs-12 col-sm-6 text-center">
				<a href="#" class="thumbnail">
					<img class="leg-img" src="${official.photoUrl}" alt="state_rep_image"/>
				</a>
			</div>`
		}
		let nameHtml = `${official.name}`
		if (!_.isEmpty(official.urls)) {
			nameHtml = `<a href="${official.urls[0]}" target="_blank" >${official.name}</a>`
		}
		html += `
		<div class="panel panel-default mt10">
			<div class="panel-body row">
				${imgHtml}
				<div class="col-xs-12 col-sm-6">
					<p class="text-center legislator-name">
						${nameHtml}
					</p>
					<p class="text-center legislator-party">
						<strong>Party:</strong> ${_.upperFirst(official.party)}
					</p>
				</div>
			</div>
		</div>
		`
	})
	return html;
}

generateForOffices = division => {
	const {offices, name} = division;
	let html = ``;
	offices.forEach(office => {
		let officeTitle = ''
		if(office.name !== division.name) {
			officeTitle = `<h4>${office.name}</h4>`
		}
		let officialsHtml = generateForOfficials(office.officials);
		let officeHtml = `${officeTitle}${officialsHtml}`
		html += officeHtml
	})
	return html
}

const generateForDivision = division => {
	const officesHtml = generateForOffices(division);
	return `<div 
		class="col-xs-12 col-sm-12 cui-panels">
			<h3>${division.name}</h3>
			${officesHtml}
	</div>`
}

const getGCivicsForAddress = address => {
	resetResults();
	$.get(`/address-lookup?address=${address}`, data => {
		console.log('data', data);
		data.forEach(division => {
			$('.row.results').append(generateForDivision(division))
		})
	});
}



const getGeocodeForAddress = address => {
	resetResults();
	const apiKey = 'AIzaSyAalrWHw-aemMa2n3Ou6T3isuVzeHtTBgI';
	const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
	$.get(url, ({ results }) => {
		let location = _.get(results, '[0].geometry.location');
		getReps(location);
	});
};

const getRepsGCivicsForLocation = location => {
	resetResults();
	const {lat, lng} = location
	const latlng = `${lat},${lng}`;
	$.get(`/address-lookup?latlng=${latlng}`, data => {
		console.log('data', data);
	});
}

const getReps = location => {
	$.get(`/geolookup/${location.lat}&/${location.lng}`, data => {
			const stateLegislators = _.filter(data, legislator => {
				return legislator.level === 'state' || !legislator.state_name;
			});
			const congressLegislators =  _.filter(data, legislator => {
				return legislator.level !== 'state' && legislator.state_name;
			});


			$('.state-legislators-panels').append('<h3>State Legislators</h4>');
			stateLegislators.forEach(leg => {
				$('.state-legislators-panels').append(generateLegislatorForState(leg));
			});

			$('.congress-legislators-panels').append('<h3>Congressional Legislators</h4>')
			congressLegislators.forEach(leg => {
				$('.congress-legislators-panels').append(generateLegislatorsForCongress(leg));
			});

			$(document).scrollTop($('.state-legislators-panels').offset().top);
		});
};

const getPartyFull = partyAbbv => {
	switch(partyAbbv) {
		case 'D':
			return 'Democratic';
		case 'R':
			return 'Republican';
		case 'I':
			return 'Independent';
		default:
			return 'N/A';
	}
};

const generatePhoneForCongress = data => {
	const phone = data.phone;
	const repTitle = _.upperFirst(data.chamber) === 'Senate' ? 'Senator' : 'Representative';
	return `<p class="text-center legislator-phone">
		<a class="btn btn-default btn-block" href="tel:${phone.replace(/-/g, '')}">
			<i class="fa fa-phone"></i>
			Call ${repTitle} ${data.last_name}
		</a>
	</p>`;
};

const generateAddressForCongress = data => {
	return `<p class="text-center legislator-address">
		<strong>Address:</strong>
		${data.office}, Washington, DC 20003
	</p>`;
};

const generateSocialMediaForCongress = data => {
	return `<p class="text-center legislator-socialmedia">
		${data.twitter_id ? `<a href="https://twitter.com/${data.twitter_id}" target="_blank">
		<img src="../img/twitter.svg" class="social"/></a>&nbsp;&nbsp;` : ''}
		${data.facebook_id ? `<a href="https://www.facebook.com/${data.facebook_id}" target="_blank">
		<img src="../img/fb.svg" class="social"/></a>&nbsp;&nbsp;` : ''}
		${data.youtube_id ? `<a href="https://www.youtube.com/user/${data.youtube_id}" target="_blank">
		<img src="../img/youtube.svg" class="social"/></a>&nbsp;&nbsp;` : ''}
	</p>`;
};

const generateLegislatorsForCongress = data => {
	const photoUrlHtml = data.photo_url ? `src="${data.photo_url}"` : '';
	const html = `
	<div class="panel panel-default mt10">
		<div class="panel-body row">
			<div class="legislator-img-col col-xs-12 col-sm-12 text-center">
				<a href="#" class="thumbnail">
					<img class="leg-img" ${photoUrlHtml}/>
				</a>
				${generateSocialMediaForCongress(data)}
			</div>
			<div class="col-xs-12 col-sm-12">
				<p class="text-center legislator-name">
					<a href="${data.website}" target="_blank" >
						${data.first_name} ${data.last_name}
					</a>
				</p>
				<p class="text-center legislator-party">
					<strong>Party:</strong> ${getPartyFull(data.party)} </p>
				<p class="text-center legislator-state">
					<strong>State:</strong> ${data.state_name}</p>
				<p class="text-center legislator-chamber">
					<strong>Chamber:</strong>
					${_.upperFirst(data.chamber)}
				</p>
				${data.district ? `<p class="text-center legislator-district">
					<strong>District:</strong> ${data.district}
				</p>`: ''}
				${generateAddressForCongress(data)}
				${generatePhoneForCongress(data)}
			</div>
		</div>
	</div>`;
	return html;
};

const generatePhoneNumbersForStateLeg = data => {
	let html = '';
	const districtOffice = _.find(data.offices, office => office.type === 'district');
	let distOfficePhone;
	if(districtOffice) {
		distOfficePhone = districtOffice.phone;
	}

	const capitolOffice = _.find(data.offices, office => office.type === 'capitol');
	let capOfficePhone;
	if (capitolOffice) {
		capOfficePhone = capitolOffice.phone;
	}

	const distOfficeHtml = `${
		distOfficePhone ? `
			<p class="text-center legislator-district-phone">
				<a class="btn btn-default btn-block" href="tel:${distOfficePhone.replace(/-/g, '')}">
					<i class="fa fa-phone"></i>
					Call District Office: ${distOfficePhone}
				</a>
			</p>` : ''
	}`;

	const capitolOfficeHtml = `${
		capOfficePhone ? `
			<p class="text-center legislator-capitol-phone">
				<a class="btn btn-default btn-block" href="tel:${capOfficePhone.replace(/-/g, '')}">
					<i class="fa fa-phone"></i>
					Call Capitol Office ${capOfficePhone}
				</a>
			</p>` : ''
	}`;

	html = `${distOfficeHtml}${capitolOfficeHtml}`;

	return html;
};

const generateAddressForStateLeg = data => {
	let html = '';
	const districtOffice = _.find(data.offices, office => office.type === 'district');
	let distOfficeAddress;
	if(districtOffice) {
		distOfficeAddress = districtOffice.address;
	}

	const capitolOffice = _.find(data.offices, office => office.type === 'capitol');
	let capOfficeAddress;
	if (capitolOffice) {
		capOfficeAddress = capitolOffice.address;
	}

	const distOfficeHtml = districtOffice ? `<p class="text-center legislator-district-address">
				<strong>District Office Address:</strong>
				<span>${distOfficeAddress}</span>
			</p>` : '';

	const capitolOfficeHtml = capitolOffice ? `<p class="text-center legislator-capitol-address">
				<strong>Capitol Office Address:</strong>
				<span>${capOfficeAddress}</span>
			</p>` : '';

	html = `${distOfficeHtml}${capitolOfficeHtml}`;

	return html;
};

const generateLegislatorForState = data => {
	const html = `
	<div class="panel panel-default mt10">
		<div class="panel-body row">
			<div class="legislator-img-col col-xs-12 col-sm-6 text-center">
				<a href="#" class="thumbnail">
					<img class="leg-img" src="${data.photo_url}" alt="state_rep_image"/>
				</a>
			</div>
			<div class="col-xs-12 col-sm-6">
				<p class="text-center legislator-name">
					<a href="${data.url}" target="_blank" >${data.full_name}</a>
				</p>
				<p class="text-center legislator-party">
					<strong>Party:</strong> ${_.upperFirst(data.party)}
				</p>
				<p class="text-center legislator-state">
					<strong>State:</strong> ${data.state.toUpperCase()}
				</p>
				<p class="text-center legislator-chamber">
					<strong>Chamber:</strong>
					${data.chamber === 'upper' ? 'State Senate' : 'State Assembly'}
				</p>
				<p class="text-center legislator-chamber">
					<strong>District:</strong> ${data.district}
				</p>
				${generateAddressForStateLeg(data)}
				${generatePhoneNumbersForStateLeg(data)}
			</div>
		</div>
	</div>`;
	return html;
};

const setPinOnMap = () => {
	var address = validateAddress();
	if (address) {
		renderMap(address);
		getGeocodeForAddress(address);
	}
};

const getGCivicsRepresentation = () => {
	const address = validateAddress();
	if (address) {
		renderMap(address);
		getGCivicsForAddress(address);
	}
}
