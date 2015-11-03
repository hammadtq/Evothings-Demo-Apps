//
// Copyright 2014, Evothings AB
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// House Sorter Hat
//
// Created November 02, 2015
//
// This implementation makes it possible to connect to a LightBlue Bean
// and get the distance from HC-SR04 module. The script also controls the
// animation (genie face) according to the distance data it receives.
//
// The LightBlue Bean needs to run the arduino sketch example named
// House Sorter Hat

document.addEventListener('deviceready', function() { app.initialize() }, false);

var app = {};

app.UUID_SCRATCHSERVICE = 'a495ff20-c5b1-4b44-b512-1370f02d74de';

app.getScratchCharacteristicUUID = function(scratchNumber)
{
	return ['a495ff21-c5b1-4b44-b512-1370f02d74de',
		'a495ff22-c5b1-4b44-b512-1370f02d74de',
		'a495ff23-c5b1-4b44-b512-1370f02d74de',
		'a495ff24-c5b1-4b44-b512-1370f02d74de',
		'a495ff25-c5b1-4b44-b512-1370f02d74de'][scratchNumber - 1];
};

app.initialize = function()
{
	app.connected = false;
};

app.deviceIsLightBlueBeanWithBleId = function(device, bleId)
{
	return ((device != null) && (device.name != null) && (device.name == bleId));
};

app.connect = function(user)
{
	//var BLEId = document.getElementById('BLEId').value;
	var BLEId = 'LightBlueBean';
	//app.showInfo('Trying to connect to "' + BLEId + '"');

	app.disconnect(user);

	function onScanSuccess(device)
	{
		function onConnectSuccess(device)
		{
			function onServiceSuccess(device)
			{
				// Update user interface
				document.getElementById('genie').style.display = 'block';

				// Application is now connected
				app.connected = true;
				app.device = device;

				// Create an interval timer to periocally read distance.
				app.interval = setInterval(function() { app.readDistance(); }, 1500);
			}

			function onServiceFailure(errorCode)
			{
				// Show an error message to the user
				app.showInfo('Error reading services: ' + errorCode);
			}

			// Connect to the appropriate BLE service
			device.readServices(
				[app.UUID_SCRATCHSERVICE],
				onServiceSuccess,
				onServiceFailure);
		};

		function onConnectFailure(errorCode)
		{
			// Show an error message to the user
			app.showInfo('Error ' + errorCode);
		}

		console.log('Found device: ' + device.name);

		// Connect if we have found a LightBlue Bean with the name from input (BLEId)
		var found= app.deviceIsLightBlueBeanWithBleId(
			device,
			'LightBlueBean');
		if (found)
		{
			// Update user interface
			app.showInfo('Found "' + device.name + '"');

			// Stop scanning
			evothings.easyble.stopScan();

			// Connect to our device
			app.showInfo('Identifying service for communication');
			device.connect(onConnectSuccess, onConnectFailure);
		}
	}

	function onScanFailure(errorCode)
	{
		// Show an error message to the user
		app.showInfo('Error: ' + errorCode);
		evothings.easyble.stopScan();
	}

	// Update the user interface
	app.showInfo('Scanning...');

	// Start scanning for devices
	evothings.easyble.startScan(onScanSuccess, onScanFailure);
};

app.disconnect = function(user)
{
	// If timer configured, clear.
	if (app.interval)
	{
		clearInterval(app.interval);
	}

	app.connected = false;
	app.device = null;

	// Stop any ongoing scan and close devices.
	evothings.easyble.stopScan();
	evothings.easyble.closeConnectedDevices();

	// Update user interface
	app.showInfo('Not connected');
};

// Animation function variables
var bothcalled = 0;
var scaredcalled = 0;

app.readDistance = function()
{
	function onDataReadSuccess(data)
	{
		var distanceData = new Uint8Array(data);
		var inches = distanceData[0];
		var cm = distanceData[1];
		
		console.log(inches);
		
		// if distance is less than 6 inches, start playing animation
		if(inches < 6 & bothcalled == 0){
		both();
		bothcalled = 1; // animation should be played only once
		
		// We have played the rolling eyes animation, now select a house randomly
		// and show it's image to the user 	
	  	setTimeout(
			function() 
				{
					document.getElementById('genie').style.display = 'none';
					var houses = Array ('syltherin','gryffindor','hufflepuff','ravenclaw');
					var house = houses[Math.floor(Math.random()*houses.length)];
					document.getElementById('houseimg').src = 'ui/images/'+house+'.png'; 
					document.getElementById('houseimg').style.display = 'block';
				}, 4000);
  
  		// the hat goes back up, the genie appears again
		}else if(inches > 6 ){
				document.getElementById('houseimg').style.display = 'none';
				document.getElementById('genie').style.display = 'block';
			bothcalled = 0;
		}
	}

	function onDataReadFailure(errorCode)
	{
		console.log('Failed to read temperature with error: ' + errorCode);
		app.disconnect();
	}

	app.readDataFromScratch(1, onDataReadSuccess, onDataReadFailure);
};

app.writeDataToScratch = function(scratchNumber, data, succesCallback, failCallback)
{
	if (app.connected)
	{
		console.log('Trying to write data to scratch ' + scratchNumber);
		app.device.writeCharacteristic(
			app.getScratchCharacteristicUUID(scratchNumber),
			data,
			succesCallback,
			failCallback);
	}
	else
	{
		console.log('Not connected to device, cant write data to scratch.');
	}
};

app.readDataFromScratch = function(scratchNumber, successCallback, failCallback)
{
	if (app.connected)
	{
		console.log('Trying to read data from scratch ' + scratchNumber);
		app.device.readCharacteristic(
			app.getScratchCharacteristicUUID(scratchNumber),
			successCallback,
			failCallback);
	}
	else
	{
		console.log('Not connected to device, cant read data from scratch.');
	}
};

app.showInfo = function(info)
{
	console.log(info);
};
