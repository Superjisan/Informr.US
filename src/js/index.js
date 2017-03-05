$(document).ready(() => {
	$('#findButton').click(setPinOnMap);

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
            })
        });
    }
})

const validateAddress = () => {
	var hasError = false;
	if (!$('#address1').val()) {
		$('#address1').parent().addClass('has-error');
		hasError = true;
	} else {
        $('#address1').parent().removeClass('has-error');
    }

	if (!$('#city').val()) {
		$('#city').parent().addClass('has-error');
		hasError = true;
	} else {
        $('#city').parent().removeClass('has-error');
    }

	if (!$('#state').val()) {
		$('#state').parent().addClass('has-error');
		hasError = true;
	} else {
        $('#state').parent().removeClass('has-error');
    }

	if (!$('#zipcode').val()) {
		$('#zipcode').parent().addClass('has-error');
	} else {
        $('#zipcode').parent().removeClass('has-error');
    }

	if (hasError) {
		$(".address-error").removeClass('hidden');
		throw new Error('address not properly defined');
	} else {
		$(".address-error").addClass('hidden');

		var address = $('#address1').val() + ' ' + $('#city').val() + ' ' + $('#state').val() + $('#zipcode').val();
		return address;
	}
}

const resetResults = () => {
    $('.state-legislators-panels').empty();
    $('.congress-legislators-panels').empty();
}

const getGeocodeForAddress = address => {
    resetResults();
	const apiKey = 'AIzaSyAalrWHw-aemMa2n3Ou6T3isuVzeHtTBgI';
	const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
	$.get(url, ({ results }) => {
		let location = _.get(results, '[0].geometry.location');
		getReps(location)
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
        })
}

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
    return `<p class="legislator-phone">
        <strong>Phone:</strong>
        <a href="tel:${phone.replace(/-/g, '')}">${phone}</a>
    </p>`
}

const generateAddressForCongress = data => {
    return `<p class="legislator-address">
        <strong>Address:</strong>
        ${data.office}, Washington, DC 20003
    </p>`
}

const generateSocialMediaForCongress = data => {
	return `<p class="legislator-socialmedia">
		${data.twitter_id ? `<a href="https://twitter.com/${data.twitter_id}" target="_blank">
		<img src="../img/twitter.svg" class="social"/></a>&nbsp;&nbsp;` : ''}
		${data.facebook_id ? `<a href="https://www.facebook.com/${data.facebook_id}" target="_blank">
		<img src="../img/fb.svg" class="social"/></a>&nbsp;&nbsp;` : ''}
		${data.youtube_id ? `<a href="https://www.youtube.com/user/${data.youtube_id}" target="_blank">
		<img src="../img/youtube.svg" class="social"/></a>&nbsp;&nbsp;` : ''}
	</p>`			
}

const generateLegislatorsForCongress = data => {
    const html = `
    <div class="panel panel-default mt10">
        <div class="panel-body row">
            <div class="legislator-img-col col-xs-4 col-sm-3">
                <a href="#">
                    <img class="leg-img img-thumbnail"/>
                </a>
				${generateSocialMediaForCongress(data)}
            </div>
            <div class="col-xs-8 col-sm-9">
                <p class="legislator-name">
                    <a href="${data.website}" target="_blank" >
                        ${data.first_name} ${data.last_name}
                    </a>
                </p>
                <p class="legislator-party">
                    <strong>Party:</strong> ${getPartyFull(data.party)} </p>
                <p class="legislator-state">
                    <strong>State:</strong> ${data.state_name}</p>
                <p class="legislator-chamber">
                    <strong>Chamber:</strong>
                    ${_.upperFirst(data.chamber)}
                </p>
                ${data.district ? `<p class="legislator-district">
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
    let html = ''
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
            <p class="legislator-district-phone">
                <strong>District Office Phone:</strong>
                <a href="tel:${distOfficePhone.replace(/-/g, '')}">${distOfficePhone}</a>
            </p>` : ''
    }`;

    const capitolOfficeHtml = `${
        capOfficePhone ? `
            <p class="legislator-capitol-phone">
                <strong>Capitol Office Phone:</strong>
                <a href="tel:${capOfficePhone.replace(/-/g, '')}">${capOfficePhone}</a>
            </p>` : ''
    }`;

    html = `${distOfficeHtml}${capitolOfficeHtml}`;

    return html;
}

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

    const distOfficeHtml = districtOffice ? `<p class="legislator-district-address">
                <strong>District Office Address:</strong>
                <span>${distOfficeAddress}</span>
            </p>` : '';

    const capitolOfficeHtml = capitolOffice ? `<p class="legislator-capitol-address">
                <strong>Capitol Office Address:</strong>
                <span>${capOfficeAddress}</span>
            </p>` : '';

    html = `${distOfficeHtml}${capitolOfficeHtml}`;

    return html;
}

const generateLegislatorForState = data => {
    const html = `
    <div class="panel panel-default mt10">
        <div class="panel-body row">
            <div class="legislator-img-col col-xs-4 col-sm-3">
                <a href="#" class="thumbnail">
                    <img src="${data.photo_url}" alt="state_rep_image"/>
                </a>
            </div>
            <div class="col-xs-8 col-sm-9">
                <p class="legislator-name">
                    <a href="${data.url}" target="_blank" >${data.full_name}</a>
                </p>
                <p class="legislator-party">
                    <strong>Party:</strong> ${_.upperFirst(data.party)}
                </p>
                <p class="legislator-state">
                    <strong>State:</strong> ${data.state.toUpperCase()}
                </p>
                <p class="legislator-chamber">
                    <strong>Chamber:</strong>
                    ${data.chamber === 'upper' ? 'State Senate' : 'State Assembly'}
                </p>
                <p class="legislator-chamber">
                    <strong>District:</strong> ${data.district}
                </p>
                ${generatePhoneNumbersForStateLeg(data)}
                ${generateAddressForStateLeg(data)}
            </div>
        </div>
    </div>`
    return html;
}

const setPinOnMap = () => {
	var address = validateAddress();
	if (address) {
		renderMap(address);
		getGeocodeForAddress(address);
	}
}