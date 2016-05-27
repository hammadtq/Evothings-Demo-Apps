/*
 * MQTT functions to interact with Bluemix IoT Foundation MQTT API
 */
 
//Object that holds application data and functions. 
var app = {}

// Your Bluemix organization ID
app.orgId = 'xxxxx'
// The username/password is the API-key and the corresponding authentication token.
app.userName = 'xxxxxxx'
app.password = 'xxxxxxx'

//Your device type and device id
app.deviceType = 'xxxxxxx'
app.deviceId = 'xxxxxxx'

// Standard port for MQTT is 1883, encrypted 8883
app.port = 8883

app.connected = false
app.ready = false

app.initialize = function() {
	document.addEventListener(
		'deviceready',
		app.onReady,
		false);
}

app.onReady = function() {
	if (!app.ready) {
		// See
		// https://docs.internetofthings.ibmcloud.com/messaging/applications.html#/publishing-device-events#publishing-device-events
		app.pubTopic = 'iot-2/type/'+app.deviceType+'/id/'+app.deviceId+'/evt/status/fmt/json' // We publish to our own device topic
		app.subTopic = 'iot-2/type/'+app.deviceType+'/id/+/evt/status/fmt/json' // We subscribe to all devices using "+" wildcard
		app.setupConnection()
		app.ready = true
	}
}

app.setupConnection = function() {
	// The hostname has the organisation id as prefix:
	// '<orgid>.messaging.internetofthings.ibmcloud.com'
	var hostname = app.orgId + '.messaging.internetofthings.ibmcloud.com'
	// See https://docs.internetofthings.ibmcloud.com/messaging/applications.html
	// The clientId is of the form 'a:<orgid>:<appid>'.
	// <appid> must be unique per client so we add device.uuid to it
	var clientId = 'a:'+ app.orgId + ':evothings'
	app.client = new Paho.MQTT.Client(hostname, app.port, clientId)
	app.client.onConnectionLost = app.onConnectionLost
	var options = {
    useSSL: true,
    userName: app.userName,
    password: app.password,
    onSuccess: app.onConnect,
    onFailure: app.onConnectFailure
  }
	app.client.connect(options);
}

app.publish = function(json) {
	message = new Paho.MQTT.Message(json)
	message.destinationName = app.pubTopic
	app.client.send(message)
};

app.subscribe = function() {
	app.client.subscribe(app.subTopic)
	console.log("Subscribed: " + app.subTopic)
}

app.unsubscribe = function() {
	app.client.unsubscribe(app.subTopic)
	console.log("Unsubscribed: " + app.subTopic)
}

app.onConnect = function(context) {
	app.subscribe()
	app.connected = true
}

app.onConnectFailure = function(e){
    console.log("Failed to connect: " + e)
  }

app.onConnectionLost = function(responseObject) {
	console.log("Connection lost: "+responseObject.errorMessage)
	app.connected = false
}

app.initialize()