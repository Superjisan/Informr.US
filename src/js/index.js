$(document).ready(() => {
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
				getGCivicsForLocation(location);
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

generateForOfficials = officials => {
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
		let phoneNumber = _.isEmpty(official.phones) ? '' : official.phones[0].replace(/-/g, '')
		let phoneHtml = '';
		if (phoneNumber) {
			phoneHtml = `<p class="text-center">
				<a class="btn btn-block btn-default" href="tel:${official.phones[0].replace(/-/g, '')}">
					<strong>
						<i class="fa fa-phone"></i>
					</strong>
					Call Rep Office
				</a>
			</p>`;
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
					${phoneHtml}
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
		data.forEach(division => {
			$('.row.results').append(generateForDivision(division))
		});

		$(document).scrollTop($('.row.results').offset().top);
	});
}

const getGCivicsForLocation = location => {
	resetResults();
	const {lat, lng} = location
	const latlng = `${lat},${lng}`;
	$.get(`/address-lookup?latlng=${latlng}`, data => {
		data.forEach(division => {
			$('.row.results').append(generateForDivision(division))
		})
		$(document).scrollTop($('.row.results').offset().top);
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

const getGCivicsRepresentation = () => {
	const address = validateAddress();
	if (address) {
		renderMap(address);
		getGCivicsForAddress(address);
	}
}
