/*
	Description: JavaScript code for IoT Alarm Clock with Neopixels examples
	Author: Hammad Tariq
	Date: 08 Nov, 2015
*/
// Application object.
var app = {}

// set wakeup timer
app.timer = function(){
var repeat = mySwitch.isChecked() //check if repeat switch is on or off
var time = document.getElementById("alarmtime").value
if(time != ""){
	time = time.split(":")
	//if repeat switch is on, we will set the alarm to be repeated at the same time everyday
	//if repeat switch is off, the alarm will be set for one time only
	if(repeat == true){
		window.wakeuptimer.wakeup( app.successCallback,  
			app.errorCallback, 
		// setting alarms, alarm will be set to repeat on all given days
		{
			alarms : [{
				type : 'daylist',
				time : { hour : time[0], minute : time[1] },
				extra : { message : 'json containing app-specific information to be posted when alarm triggers' },
				days : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], 
				message : 'Alarm has expired!'
			}] 
		}
		)
	}else{
		window.wakeuptimer.wakeup( app.successCallback,  
			app.errorCallback, 
		// one time alarm to set
		{
			alarms : [{
				type : 'onetime',
				time : { hour : time[0], minute : time[1] },
				extra : { message : 'json containing app-specific information to be posted when alarm triggers' },
				message : 'Alarm has expired!'
			}] 
		}
		)
	}
}else{
	alert("Alarm time cannot be empty")
}
}

// this function is called upon receiving success message
app.successCallback = function(result) {
	if (result.type==='wakeup') {
		console.log('wakeup alarm detected--' + result.extra)
		app.led("on")
		document.getElementById('turnoff').style.display = 'block';
	} else if(result.type==='set'){
		alert ('Alarm is set')
		console.log('wakeup alarm set--' + result)
	} else {
		console.log('wakeup unhandled type (' + result.type + ')')
	}
}; 

// this function is called if an error has occurred while setting the alarm
app.errorCallback = function(result) {
	console.log("Error")
}; 

// Below variables and functions deal with Particle Cloud communication

// Device ID - Get it from Particle Cloud Devices Page
app.deviceId = 'your-device-id'

// Access Token - Get it from Particle Cloud Settings Page
app.accessToken = 'your-access-token'

// Particle Function Name - As declared by Particle.function() in your sketch/firmware
app.functionName = 'alarm' 

// Connection URL
app.url = 'https://api.particle.io/v1/devices/'+app.deviceId+'/'+app.functionName+'?access_token='+app.accessToken+'';

// Turn on/off LED.
app.led = function(state)
{

	$( "#result" ).html('<img src="ui/images/spinning-wheel.gif">')
	
	// Send the data using post
	var posting = $.post( app.url, { args: state } )

	// If the request was successful
	posting.done(function( data ) {
		$( "#result" ).empty().append( "Request successful" )
	});
	
	// If the request failed  
	posting.fail(function() {
		$( "#result" ).empty().append( "Request failed" )
	});
}

// Turn-off the Alarm (in this case the Neopixel LED rig)
app.alarmoff = function(){
	document.getElementById('turnoff').style.display = 'none'
	app.led("off")
}