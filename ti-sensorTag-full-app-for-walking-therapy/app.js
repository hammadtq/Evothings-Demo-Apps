// JavaScript code for the BLE Scan example app.
// The code is inside a closure to avoid polluting the global scope.
;(function()
{

// Dictionary of found devices.
var devices = {}

//DB instance 
var mydb;

//Device Average array
var deviceAvgL = []; //left
var deviceAvgR = []; //right

// Timer that updates the displayed list of devices.
var updateTimer = null

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

function onDeviceReady()
{

	//Test for browser compatibility
	if (window.openDatabase) {
    //Create the database the parameters are 1. the database name 2.version number 3. a description 4. the size of the database (in bytes) 1024 x 1024 = 1MB
    mydb = openDatabase("names", "0.1", "Database of Lets do it App Users", 1024 * 1024);

    //create the cars table using SQL for the database using a transaction
    mydb.transaction(function (t) {
        t.executeSql("CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY ASC, username TEXT, left TEXT, right TEXT)");
    });
	} else {
		alert("WebSQL is not supported by your browser!");
	}


	var x = location.href.split('/').pop();
	console.log(x)
	if(x == "challenge.html" || x == "assessment.html"){
  // Un-gray buttons.
  $('button.app-start-scan')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--green-A700')
  $('button.app-stop-scan')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--deep-orange-900')    
  $('button.app-stop-value')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--deep-orange-900')
    
  $('.app-start-scan').on('click', startScan)
  $('.app-stop-scan').on('click', stopScan)
  $('.app-stop-value').on('click', stopTest)
    
    //The Welcome User-name on challenge screen
    var storage = window.localStorage;
  	var keyvalue = storage.getItem("username"); // Pass a key name to get its value.
  	console.log(keyvalue)
	$('#user-name-block').html(keyvalue)
    
    }
    
  if(x == "listUsers.html"){
  	var storage = window.localStorage;
  	//check to ensure the mydb object has been created
    if (mydb) {
        //Get all the cars from the database with a select statement, set outputCarList as the callback function for the executeSql command
        mydb.transaction(function (t) {
            t.executeSql("SELECT * FROM names", [], namesList);
        });
    } else {
        alert("db not found, your browser does not support web sql!");
    }
    attachUserList()
    
  }
  
  $('button.app-login')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--green-A700')
  $('button.app-new-user')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--green-A700')

  // Attach event listeners.
  $('.app-login').on('click', login)
  $('.app-new-user').on('click', newUser)
}

function attachUserList(){
	$('#usernamelist').on('click', 'li', function() {
	
    	console.log( $(this).html());
    	console.log(this.id)
    	console.log( $(this).find("span").html());
    	var spanhtml = $(this).find("span").html()
    	var liUser = spanhtml.split("&nbsp;");
    	console.log(liUser[0])
    	//using local storage as temporary session storage
		var storage = window.localStorage;
		storage.setItem("username", liUser[0]) // Pass a key name and its value to add or update that key.
		window.location = "challenge.html";
    	
	});
	
	
}



function namesList(transaction, results){
	 var i;
	  //initialise the listitems variable
    	var listitems = "";
    	//get the car list holder ul
    	var listholder = document.getElementById("usernamelist");
    	 //clear cars list ul
    	listholder.innerHTML = "";
    //Iterate through the results
    for (i = 0; i < results.rows.length; i++) {
        //Get the current row
        var row = results.rows.item(i);
        console.log(row.username)
       
    	listholder.innerHTML += "<li class='mdl-list__item'><span class='mdl-list__item-primary-content'>" + row.username + "&nbsp;&nbsp;L:"+row.left+"&nbsp;-&nbsp;R:"+row.right+"</span><span class='mdl-list__item-secondary-action'><button class='mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored' onclick="+'deleteUser('+row.id+',event);'+"><i class='material-icons'>delete</i></button></span>";
    
        }
}

function stopTest(){
	window.location = "listUsers.html"
}




function newUser(){
	var username = $('#username').val();
	//using local storage as temporary session storage
	var storage = window.localStorage;
	storage.setItem("username", username) // Pass a key name and its value to add or update that key.
	
	//web sql storage as permanent user storage
	mydb.transaction(function (t) {
                t.executeSql("INSERT INTO names (username, left, right) VALUES (?, ?, ?)", [username,0,0],
                function(tx, results){
                console.log('Returned ID: ' + results.insertId);
                storage.setItem("userid", results.insertId) // Pass a key name and its value to add or update that key.
            },
            errorCB);
                });	
	window.location = "assessment.html"
}

function errorCB(){
alert("error with database")
}

function challengeResults(){
	console.log("results should be here")
	
  	var sum = 0;
		for( var i = 0; i < deviceAvgL.length; i++ ){
    	sum += parseInt( deviceAvgL[i], 10 ); //don't forget to add the base
	}

	var avgL = Math.round(sum/deviceAvgL.length);	
	deviceAvgL = []
	
	var sum = 0;
		for( var i = 0; i < deviceAvgR.length; i++ ){
    	sum += parseInt( deviceAvgR[i], 10 ); //don't forget to add the base
	}

	var avgR = Math.round(sum/deviceAvgR.length);	
	deviceAvgR = []
	
	
    $('#leftAvg').text(avgL)
    $('#rightAvg').text(avgR)
	
	var dialog = document.querySelector('dialog');
	if (! dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
    }
	 dialog.showModal();
	 dialog.querySelector('.close').addEventListener('click', function() {
      dialog.close();
      window.location = "listUsers.html"
    });
    dialog.querySelector('.yes').addEventListener('click', function() {
    //store the updated values
	//using local storage as temporary session storage
	var storage = window.localStorage;
	var username = storage.getItem("username") 
	console.log("UPDATE names SET left = '"+avgL+"', right = '"+avgR+"' WHERE username = '"+username+"'")
	if(mydb){
		//web sql storage as permanent user storage
		mydb.transaction(function (t) {
					t.executeSql('UPDATE names' +
              				' SET left = ?, right = ?' +
              				' WHERE username = ?',
             				 [avgL, avgR, username], 
					function(t, results){
					console.log(results)
				},
				errorCB);
					});
		}
      window.location = "listUsers.html"
    });
	
}

function login(){
	var username = $('#username').val();
	//using local storage as temporary session storage
	var storage = window.localStorage;
	storage.setItem("username", username) // Pass a key name and its value to add or update that key.
	if (mydb) {
        //Get all the cars from the database with a select statement, set outputCarList as the callback function for the executeSql command
        mydb.transaction(function (t) {
            t.executeSql("SELECT * FROM names WHERE (username='"+username+"')", [],function(t, results){
                console.log(results.rows.length) 
                if (results.rows.length > 0) {
                    window.location = "challenge.html";
                 } else {
                    alert("Invalid username or password");
                 }
            },
            errorCB) ;
        });
    } else {
        alert("db not found, your browser does not support web sql!");
    }
}
function startScan()
{
  // Make sure scan is stopped.
  stopScan()
  

  // Start scan.
  evothings.ble.startScan(
    function(device)
    {
      // Device found. Sometimes an RSSI of +127 is reported.
      // We filter out these values here.
      if (device.rssi <= 0)
      {
        // Set timeStamp.
        device.timeStamp = Date.now()

        // Store device in table of found devices.
        devices[device.address] = device
      }
    },
    function(error)
    {
      showMessage('Scan error: ' + error)
      stopScan()
    }
  )

  // Start update timer.
  updateTimer = setInterval(updateDeviceList, 500)

  // Update UI.
  $('.mdl-progress').addClass('mdl-progress__indeterminate')
  showMessage('Scan started')
}

function stopScan()
{
  // Stop scan.
  evothings.ble.stopScan()

  // Clear devices.
  devices = {}

  // Stop update timer.
  if (updateTimer)
  {
    clearInterval(updateTimer)
    updateTimer = null
  }

  // Update UI.
  $('.mdl-progress').removeClass('mdl-progress__indeterminate')
  $('.app-cards').empty()
  hideDrawerIfVisible()

}

function hideDrawerIfVisible()
{
  if ($('.mdl-layout__drawer').hasClass('mdl-layout__drawer is-visible'))
  {
    document.querySelector('.mdl-layout').MaterialLayout.toggleDrawer()
  }
}

function showMessage(message)
{
  document.querySelector('.mdl-snackbar').MaterialSnackbar.showSnackbar(
  {
    message: message
  })
}

function updateDeviceList()
{
  var timeNow = Date.now();

  $.each(devices, function(key, device)
  {
    // Only show devices that have been updated during the last 10 seconds.
    if (device.timeStamp + 10000 > timeNow)
    {
       displayDevice(device)
    }
    else
    {
      // Remove inactive device.
      removeDevice(device)
    }
  })
}

var startT = 0;

function displayDevice(device)
{
  if (!deviceIsDisplayed(device))
  {
  var s = device.advertisementData.kCBAdvDataServiceUUIDs;
	if(s && s[0] == "0000aa80-0000-1000-8000-00805f9b34fb"){
    createDevice(device)
    	if(startT == 0){
    		startTimer(30, $('#time'))
    		startT = 1;
    	}
    }
  }
  updateDevice(device)
}

function deviceIsDisplayed(device)
{
  var deviceId = '#' + getDeviceDomId(device)
  return !!($(deviceId).length)
}


var count = 0;

function updateDevice(device)
{
  var domid = getDeviceDomId(device);
  var leftGoal = $('#leftGoalv').val()
  var rightGoal = $('#rightGoalv').val()
  
  var s = device.advertisementData.kCBAdvDataServiceUUIDs;
  if(s && s[0] == "0000aa80-0000-1000-8000-00805f9b34fb"){
  // Map the RSSI value to a width in percent for the indicator.
  var distanceBarValue = 100; // Used when RSSI is zero or greater.
  if (device.rssi < -100) { distanceBarValue = 1; }
  else if (device.rssi < 0) { distanceBarValue = 100 + device.rssi; }

  var deviceId = '#' + getDeviceDomId(device)
  
	if( domid == "device-dom-id-24_71_89_BE_FC_83"){
  		$('#lvalue').text(device.rssi)
  		deviceAvgL.push(device.rssi)
  			
  		if(leftGoal != "" && device.rssi < -leftGoal){
  			console.log("play left")
  		}
  		}
  	if(domid == "device-dom-id-24_71_89_E6_4C_02"){
  			$('#rvalue').text(device.rssi)
  			deviceAvgR.push(device.rssi)
  			if(rightGoal != "" && device.rssi < -rightGoal){
  			console.log("play right")
  		}
  		}
}
  $(deviceId + ' .device-distance-bar')
    .css('width', distanceBarValue + 'px')

  if (!device.advertisementData) return

  $(deviceId + ' .device-kCBAdvDataLocalName')
    .text(device.advertisementData.kCBAdvDataLocalName)
  $(deviceId + ' .device-kCBAdvDataTxPowerLevel')
    .text(device.advertisementData.kCBAdvDataTxPowerLevel)
  $(deviceId + ' .device-kCBAdvDataIsConnectable')
    .text(device.advertisementData.kCBAdvDataIsConnectable)
  $(deviceId + ' .device-kCBAdvDataServiceUUIDs')
    .text(JSON.stringify(device.advertisementData.kCBAdvDataServiceUUIDs))
  $(deviceId + ' .device-kCBAdvDataServiceData')
    .text(JSON.stringify(device.advertisementData.kCBAdvDataServiceData))
}

function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    var start = setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.text(minutes + ":" + seconds);

        if (--timer < 0) {
            timer = duration;
            clearInterval(start)
            stopScan()
            challengeResults()
        }
    }, 1000);
}

jQuery(function ($) {
    var fiveMinutes = 30,
        display = $('#time');
});

function createDevice(device)
{
  // Create HTML element to display device data.
  var domId = getDeviceDomId(device);
  var element = $(
    '<div id="' + domId + '" class="mdl-card mdl-card--border mdl-shadow--2dp">'
    +  '<div class="mdl-card__title">'
    +    '<h2 class="mdl-card__title-text">Device: ' + device.name + '</h2>'
    +  '</div>'
    +  '<div class="mdl-card__supporting-text">'
    +    'RSSI: <span class="device-rssi"></span><br>'
    +    'RSSI Average: <span class="device-rssi-avg"></span><br>'
    +  '</div>'
    + '</div>')

  // Add element.
  //$('.app-cards').append(element)
}

function removeDevice(device)
{
  // Remove from UI.
  var deviceId = '#' + getDeviceDomId(device)
  $(deviceId).remove()

  // Delete from model.
  delete devices[devices.address]
}

function getDeviceDomId(device)
{
  return 'device-dom-id-' + device.address.replace(/:/g, "_")
}

main()

})();
