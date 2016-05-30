/*
 * MQTT functions to interact with Bluemix IoT Foundation MQTT API
 */
 
//Object that holds application data and functions. 
var app = {};

// Your Bluemix organization ID
var orgId = 'xxxxxx'
// The username/password is the API-key and the corresponding authentication token.
var userName = 'xxxxxxxxxx'
var password = 'xxxxxxxxxx'

//Your device type and device id
var deviceType = 'xxxxxxx'
var deviceId = 'xxxxxxxxxxx'

// Standard port for MQTT is 1883, encrypted 8883
var port = 8883

app.connected = false
app.ready = false

//init chart arrays
app.ambientTemp = ['Ambient Temp']
app.humidity = ['Humidity']
app.light = ['Light']

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
		app.pubTopic = 'iot-2/type/'+deviceType+'/id/'+deviceId+'/evt/status/fmt/json'; // We publish to our own device topic
		app.subTopic = 'iot-2/type/'+deviceType+'/id/+/evt/status/fmt/json'; // We subscribe to all devices using "+" wildcard
		app.setupConnection();
		app.ready = true;
		
		//generate the initial chart
		app.chart = c3.generate({
		bindto: '#chart',
		data: {
		  columns: [
    			['Ambient Temp', 0],
    			['Humidity', 0],
    			['Light', 0]
  			]
		}
		})
		
	}
}

app.setupConnection = function() {
	// The hostname has the organisation id as prefix:
	// '<orgid>.messaging.internetofthings.ibmcloud.com'
	var hostname = orgId + '.messaging.internetofthings.ibmcloud.com'
	// See https://docs.internetofthings.ibmcloud.com/messaging/applications.html
	// The clientId is of the form 'a:<orgid>:<appid>'.
	// <appid> must be unique per client so we add device.uuid to it
	var clientId = 'a:'+ orgId + ':evothings'
	app.client = new Paho.MQTT.Client(hostname, port, clientId)
	app.client.onConnectionLost = app.onConnectionLost
	app.client.onMessageArrived = app.onMessageArrived
	var options = {
    useSSL: true,
    userName: userName,
    password: password,
    onSuccess: app.onConnect,
    onFailure: app.onConnectFailure
  }
	app.client.connect(options)
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
	//app.status("Connected!")
	app.connected = true
}

app.onConnectFailure = function(e){
    console.log("Failed to connect: " + e)
  }

app.onConnectionLost = function(responseObject) {
	//app.status("Connection lost!")
	console.log("Connection lost: "+responseObject.errorMessage)
	app.connected = false
}

// called when a message arrives
app.onMessageArrived = function(message) {
  console.log("onMessageArrived:"+message.payloadString)
  var payload = jQuery.parseJSON(message.payloadString)
  app.ambientTemp.push(payload.ambientTemp)
  app.humidity.push(payload.humidity)
  app.light.push(payload.light)
  app.chart.load({
  columns: [
  		app.ambientTemp,
  		app.humidity,
  		app.light
  	]
  })
}

app.initialize()