# Facebook Parse IoT demo app

Now you can create mobile apps in JavaScript that communicate with BLE devices and interact with the Facebook Parse data cloud. In this tutorial we will use a Texas Instruments SensorTag to monitor temperature data and send values to the Parse cloud. Read on to learn more about setting up a Parse account and how to use Evothings Studio to develop an IoT app for the SensorTag that saves cloud data. You can even try out the example if you do not have a SensorTag. It is easy to get started!

<!--more-->

## Mobile apps for IoT and cloud data

A common use case for Internet of Things applications is to collect data from a sensor device and send that data to a cloud service. Examples include health and fitness data, temperature values, or motion tracking data. Commonly BLE devices (Bluetooth Low Energy - Bluetooth Smart) are equipped with sensors and used to track readings. One example of a Sensor device is the Texas Instruments SensorTag.

When reading data over BLE a mobile application is used to communicate with the sensor device. Thanks to high-level JavaScript libraries, it is easy to set up the BLE communication and read data from the sensors.

In this tutorial you will learn how to create an app using Evothings Studio that reads temperature values from the SensorTag and sends the data to the Parse cloud.

If you do not have a SensorTag, you can still explore the example code and send data to the Parse cloud. Read on below to learn more.

## What you need

Here is what you need to get started:

<ul>
    <li>Texas Instruments SensorTag <a href="http://www.ti.com/ww/en/wireless_connectivity/sensortag/"></a> - Current example code supports the original CC2541 SensorTag, we are in the process of updating the tisensortag.js library to support the new CC2650 Bluetooth Smart SensorTag. If you do not have a SensorTag, modify the example code as outlined below to try out the Parse cloud functionality.</li>
    <li><a href="http://evothings.com/">Evothings Studio</a> - <a href="http://evothings.com/download/">Download</a> for OS X, Windows and Linux.</li>
    <li>Evothings Client app - Install on iOS or Android phones/tablets, get it from Apple App Store or Google Play.</li>
    <li>WiFi network that allows client connections - <strong>Network client isolation must be disabled</strong>.</li>
    <li><a href="http://evothings.com/evothings-studio-starter-kit/">Basic knowledge of Evothings Studio</a> - You can also learn as you go through this tutorial.</li>
</ul>


## Install Evothings Studio

The <a href="http://evothings.com/evothings-studio-starter-kit/">Evothings Studio Starter Kit</a> explains how to install and use Evothings Studio. For the quick version just <a href="http://evothings.com/download/">download the Studio package</a> and get Evothings Client from the app stores.

## Download the example app code

The <a href="https://github.com/divineprog/evo-demos/tree/master/Demos2015/parse-iot-demo">example code for this tutorial</a> is available on GitHub. The app is called "Parse IoT Demo" and contains the code needed to run the app using Evothings Client and Evothings Workbench.

## Set up your Parse account

<a href="https://www.parse.com/#signup">Sign up for a Parse account.</a> Then follow the on-screen guides to create a Parse app. The Parse app is a functional unit where you can store data and also add server side code if needed. You can name the app anything you want, we named ours "Evothings Parse".

Go to the <a href="https://parse.com/apps/quickstart#">Quickstart guide</a> and click the "Data" icon. Then click "Web" and then "New project". You are now presented with the Application ID and JavaScript key and some sample test code.

## Fill in the application ids in the mobile app

What you need to do next is to open file index.html in the mobile app code downloaded from GitHub.

Locate the following place in the code and fill in the keys from the Parse web page found under Step 2 (this is the only thing you need to do, no need to do Step 1 or make the SDK test):

    // TODO: Insert your Parse Application ID and
    // JavaScript key here.
    Parse.initialize(
        'Parse Application ID',
        'JavaScript key')

You may also want to make temperature readings more frequent. Default setting in the example is once every minute, which could be reasonable for a production app but does not make for much action when testing. Here is the line to update:

    var temperatureInterval = 60000 // Change to 5000 for 5 second intervals.

Then save the file index.html.

## Run the app

To run the app, do as follows:

<ul>
    <li>Launch Evothings Workbench</li>
    <li>Drag file index.html to the Workbench project list window</li>
    <li>Start Evothings Client on your mobile or tablet - you need at least iOS 7 or Android 4.3 with BLE support.</li>
    <li>Connect to the Workbench from Evothings Client -  Use the same WiFi network for the Workbench and the mobile and make sure that it allows client connections. Network client isolation must be disabled.</li>
    <li>Click the RUN button for "Parse IoT Demo" in the Workbench project list.</li>
    <li>Activate the SensorTag (you currently need the original CC2541 SensorTag).</li>
    <li>Press the on-screen button "Start reading SensorTag".</li>
    <li>Now the app should connect to the .</li>
</ul>

## Inspect data in the Parse Web UI

Now go to the page where data objects are displayed. The following link should work:

<a href="https://parse.com/apps/evothings-parse/collections#class/SensorTagReading">https://parse.com/apps/evothings-parse/collections#class/SensorTagReading</a>

Click the refresh icon in the upper-right corner to see new values.

The app saves data by creating objects of type SensorTagReading. There is one new object created for each temperature reading. This may not be the most optimal approach, but hopefully serves the purpose to illustrate the concept of saving sensor data to a data cloud!

## What if I do not have a SensorTag

If you do not have a SensorTag you can still test the cloud save functionality.

First comment out the initialisation of the SensorTag:

    function initialise()
    {
        // initialiseSensorTag()
        initializeParse()
    }

Next add a timer that writes simulated "temperature" values:

    function initialise()
    {
        // initialiseSensorTag()
        initializeParse()
        initialiseSimulationTimer()
    }

    function initialiseSimulationTimer()
    {
    	// Timer that updates temperature values.
        setInterval(function() {
            lastTemperatureReading = ((Math.random() * 5) + 20).toFixed(2)
        	},
        	5000)

        // Timer that sends data to the cloud.
        setInterval(onTemperatureTimer, 5000)
    }

When the app is launched or reloaded, it will automatically start sending simulated values to the Parse cloud. Do not press the "Start" button when using the above code! That will cause errors ;)

## Get started right away

<a href="http://evothings.com/download/">Download Evothings Studio</a> and get up and running within minutes!

Have fun!




