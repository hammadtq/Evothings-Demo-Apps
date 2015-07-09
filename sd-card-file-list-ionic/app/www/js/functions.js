// This functions library is used to connect, disconnect and retrieve data
// from Arduino using TCP server running on WiFi shield.
// This library is dependent on arduinotcp.js

// Short name for Arduino TCP library.
var arduino = evothings.arduinotcp

// Application object.
var app = {}

app.connect = function()
{
	arduino.connect(document.getElementById('ArduinoIpAddress').value, 3300, function(success)
	{
		if (success)
		{
			arduino.digitalRead(2,app.success)
			window.location.href='#/listview'		
		}
		else
		{
			alert('Connection error')
		}
	})
}

app.disconnect = function()
{
	arduino.disconnect()
	window.location.href='#/'
}

app.success = function(data)
{
	var list = data.slice(0,-1)
	list = list.split("\t")
	var scope = angular.element(document.getElementById("fileListView")).scope();
		scope.$apply(function(){
			scope.items = list
		})
}