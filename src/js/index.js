$(document).ready(() => {
	$('#findButton').click(function() {
		setPinOnMap();
	});
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
		var address = $('#address1').val() + $('#city').val() + $('#state').val() + $('#zipcode').val();
		return address;
	}
}

const resetResults = () => {
    $('.state-legislators-panels').empty();
    $('.congress-legislators-panels').empty();
}

const getReps = address => {
    resetResults();
	const apiKey = 'AIzaSyAalrWHw-aemMa2n3Ou6T3isuVzeHtTBgI';
	const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`;
	$.get(url, ({ results }) => {
		let location = _.get(results, '[0].geometry.location');
		$.get(`/geolookup/${location.lat}&/${location.lng}`, data => {
            const stateLegislators = _.filter(data, legislator => {
                return legislator.level === 'state' || !legislator.state_name;
            });
            const congressLegislators =  _.filter(data, legislator => {
                return legislator.level !== 'state' && legislator.state_name;
            });

            stateLegislators.forEach(leg => {
                $('.state-legislators-panels').append(generateLegislatorForState(leg));
            });

            congressLegislators.forEach(leg => {
                $('.congress-legislators-panels').append(generateLegislatorsForCongress(leg));
            });

		})
	});
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

const generateLegislatorsForCongress = data => {
    const html = `<h4 class="hidden">State Legislators</h4>
    <div class="panel panel-default mt10">
        <div class="panel-body row">
            <div class="col-xs-12 col-sm-12">
                <p class="legislator-name">
                    <a href="${data.website}" target="_blank" >
                        ${data.first_name} ${data.last_name}
                    </a>
                </p>
                <p class="legislator-party">Party: ${getPartyFull(data.party)} </p>
                <p class="legislator-state">State: ${data.state_name}</p>
                <p class="legislator-chamber">Chamber: ${_.upperFirst(data.chamber)}</p>
            </div>
        </div>
    </div>`;
    return html;
};


const generateLegislatorForState = data => {
    const html = `<h4 class="hidden">Congressional Legislators</h4>
    <div class="panel panel-default mt10">
        <div class="panel-body row">
            <div class="legislator-img-col col-xs-3 col-sm-3">
                <img class="leg-img" src="${data.photo_url}"/>
            </div>
            <div class="col-xs-9 col-sm-9">
                <p class="legislator-name">
                    <a href="${data.url}" target="_blank" >${data.full_name}</a>
                </p>
                <p class="legislator-party">Party: ${_.upperFirst(data.party)}</p>
                <p class="legislator-state">State: ${data.state.toUpperCase()}</p>
                <p class="legislator-chamber">Chamber: ${_.upperFirst(data.chamber)}</p>
            </div>
        </div>
    </div>`
    return html;
}

const setPinOnMap = () => {
	var address = validateAddress();
	if (address) {
		renderMap(address);
		getReps(address);
	}
}