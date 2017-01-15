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
	}

	if (!$('#city').val()) {
		$('#city').parent().addClass('has-error');
		hasError = true;
	}

	if (!$('#state').val()) {
		$('#state').parent().addClass('has-error');
		hasError = true;
	}

	if (!$('#zipcode').val()) {
		$('#zipcode').parent().addClass('has-error');
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

const getReps = address => {
	const apiKey = 'AIzaSyAalrWHw-aemMa2n3Ou6T3isuVzeHtTBgI';
	const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`;
	$.get(url, ({ results }) => {
		let location = _.get(results, '[0].geometry.location');
		$.get(`/geolookup/${location.lat}&/${location.lng}`, data => {
			$('.json').jsontree(JSON.stringify(data))
			$('.result-json').removeClass('hidden');
            const stateLegislators = _.filter(data, legislator => {
                return legislator.level === 'state';
            });
            console.log(stateLegislators);
            stateLegislators.forEach(leg => {
                $('.result-legislators-panels').append(generateLegislatorForState(leg));
            })
		})
	});
}

const generateLegislatorForState = data => {
    console.log(data);
    const html = `<div class="panel panel-default mt10">
        <div class="panel-body row">
            <div class="legislator-img-col col-xs-3 col-sm-3">
                <img class="leg-img" src="${data.photo_url}"/>
            </div>
            <div class="col-xs-9 col-sm-9">
                <p class="legislator-name"> ${data.full_name}</p>
                <p class="legislator-party">Party: ${data.party}</p>
                <p class="legislator-state">State: ${data.state}</p>
                <p class="legislator-level">Level: ${data.level}</p>
                <p class="legislator-chamber">Chamber: ${data.chamber}</p>
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