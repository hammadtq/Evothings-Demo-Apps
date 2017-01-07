// SensorTag object.
var sensortag

// Variable that holds last known temperature reading.
var lastTemperatureReading = '0.0'

// Variable that holds last known humidity reading.
var lastHumidityReading = '0.0'

function initialiseSensorTag()
{
	// Create SensorTag CC2650 instance.
	sensortag = evothings.tisensortag.createInstance(
		evothings.tisensortag.CC2650_BLUETOOTH_SMART)

	// Uncomment to use SensorTag CC2541.
	//sensortag = evothings.tisensortag.createInstance(
	//	evothings.tisensortag.CC2541_BLUETOOTH_SMART)

	//
	// Here sensors are set up.
	//
	// If you wish to use only one or a few sensors, just set up
	// the ones you wish to use.
	//
	// First parameter to sensor function is the callback function.
	// Several of the sensors take a millisecond update interval
	// as the second parameter.
	//
	sensortag
		.statusCallback(statusHandler)
		.errorCallback(errorHandler)
		.temperatureCallback(temperatureHandler, 1000)
		.humidityCallback(humidityHandler, 1000)
		.luxometerCallback(luxometerHandler, 1000)
}

function connect()
{	
	// Un-gray buttons.
	$('button.app-start-push')
		.removeClass('mdl-button--disabled')
		.addClass('mdl-color--green-A700')

	// Attach event listener.
	 $('.app-start-push').on('click', startPush)
	 
	 $('button.app-connect')
		.removeClass('mdl-color--green-A700')
		.addClass('mdl-color--deep-orange-900')
		.html('Disconnect')
		// Attach event listener.
		$('.app-connect').off('click', connect)
		$('.app-connect').on('click', disconnect)
		
	 sensortag.connectToNearestDevice()
}

function disconnect()
{
	sensortag.disconnectDevice()
	$('button.app-connect')
		.removeClass('mdl-color--deep-orange-900')
		.addClass('mdl-color--green-A700')
		.html('Connect')
	// Attach event listener.
	$('.app-connect').off('click', disconnect)
	$('.app-connect').on('click', connect)
	
	// Un-gray buttons.
	$('button.app-start-push')
		.removeClass('mdl-color--green-A700')
		.addClass('mdl-button--disabled')

	// Attach event listener.
	$('.app-start-push').off('click', startPush)
}


function statusHandler(status)
{
	if ('DEVICE_INFO_AVAILABLE' == status)
	{
		// Show a notification about that the firmware should be
		// upgraded if the connected device is a SensorTag CC2541
		// with firmware revision less than 1.5, since this the
		// SensorTag library does not support these versions.
		var upgradeNotice = document.getElementById('upgradeNotice')
		if ('CC2541' == sensortag.getDeviceModel() &&
			parseFloat(sensortag.getFirmwareString()) < 1.5)
		{
			upgradeNotice.classList.remove('hidden')
		}
		else
		{
			upgradeNotice.classList.add('hidden')
		}

		// Show device model and firmware version.
		displayValue('DeviceModel', sensortag.getDeviceModel())
		displayValue('FirmwareData', sensortag.getFirmwareString())

		// Show which sensors are not supported by the connected SensorTag.
		if (!sensortag.isLuxometerAvailable())
		{
			document.getElementById('Luxometer').style.display = 'none'
		}
	}

	displayValue('StatusData', status)
}

function errorHandler(error)
{
	console.log('Error: ' + error)

	if (evothings.easyble.error.DISCONNECTED == error)
	{
		resetSensorDisplayValues()
	}
	else
	{
		displayValue('StatusData', 'Error: ' + error)
	}
}

function temperatureHandler(data)
{
	// Calculate temperature from raw sensor data.
	var values = sensortag.getTemperatureValues(data)
	var ac = values.ambientTemperature
	lastTemperatureReading = ac.toFixed(2)
	$('#TemperatureData').text(lastTemperatureReading);
	//console.log(lastTemperatureReading)
}


function statusHandler(status)
{
	displayMessage(status)
}

function errorHandler(error)
{
	displayMessage('SensorTag error: ' + error)
}

function displayMessage(message)
{
	document.getElementById('status').innerHTML = message
	console.log(message)
}

function humidityHandler(data)
{
	// Calculate the humidity values from raw data.
	var values = sensortag.getHumidityValues(data)

	// Calculate the humidity temperature (C)
	var tc = values.humidityTemperature
	
	lastHumidityReading = tc.toFixed(2)
	$('#HumidityData').text(lastHumidityReading)
	//console.log(lastHumidityReading)
}

function luxometerHandler(data)
{
	var value = sensortag.getLuxometerValue(data)
	
	lastLightReading = value.toPrecision(5)
	$('#LuxometerData').text(lastLightReading)
	//console.log(lastLightReading)
}

function displayValue(elementId, value)
{
	document.getElementById(elementId).innerHTML = value
}


//This function submits the data to Firebase cloud
function startPush() {

	//Please provide your own Firebase details below
	var app_id = "xxxxxxxxxx" //your app id
	var device_id = "TI SensorTag CC2650"; //device id
	var evt = {"temperature": lastTemperatureReading, "humidity": lastHumidityReading, "luxometer": lastLightReading}
	
	cordovaHTTP.postJson("https://"+app_id+".firebaseio.com/messages.json", {
	"type": "message","sdid": device_id,"data":evt
	}, { "Content-Type": "application/json", "Accept": "application/json" }, function(response) {
	// prints 200
	console.log(response.status);
	try {
		response.data = JSON.parse(response.data);
		// prints msg
		if (response.status == '200' || response.status == '202'){
			alert("Firebase: Request Accepted");
		}
	} catch(e) {
		console.error("JSON parsing error");
	}
	}, function(response) {
		// prints 403
		console.log(response.status);

		//prints Permission denied 
		console.log(response.error);
	});
}

function onDeviceReady()
{
  // Un-gray buttons.
  $('button.app-connect')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--green-A700')

  // Attach event listener.
  $('.app-connect').on('click', connect)
  evothings.scriptsLoaded(initialiseSensorTag) 
}

function main()
{
  $(function()
  {
    // When document has loaded we attach FastClick to
    // eliminate the 300 ms delay on click events.
    FastClick.attach(document.body)

    // Event listener for Back button.
    $('.app-back').on('click', function() { history.back() })
  })

  // Event handler called when Cordova plugins have loaded.
  document.addEventListener(
    'deviceready',
    onDeviceReady,
    false)
}

main();