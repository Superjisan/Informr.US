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
		})
	});
}

const setPinOnMap = () => {
	var address = validateAddress();
	if (address) {
		renderMap(address);
		getReps(address);
	}
}