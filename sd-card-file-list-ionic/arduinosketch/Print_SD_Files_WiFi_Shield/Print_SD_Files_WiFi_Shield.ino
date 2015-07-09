/*
Arduino WiFi Script Server 

Created October 20, 2013
Mikael Kindborg, Evothings AB

Modified to retrieve the file list 
from a SD card directory.

Modified July 09, 2015
Modified by Hammad Tariq

TCP socket server that accept commands for basic scripting
of the Arduino board.

This example is written for a network using WPA encryption.
For WEP or WPA, change the Wifi.begin() call accordingly.

The API consists of the requests listed below.

Requests and responses end with a new line.

Make sure there are few files present in target SD card 
directory.

Make sure that you don't run out of Arduino's SRAM.

*/

// Include files.
#include <SD.h>
#include <WiFi.h>

File root;

// Your network SSID (network name).
// TODO: Enter the name of your wifi network here.
char ssid[] = "SoKamal2";

// Your network password.
// TODO: Enter the password of your wifi network here.
char pass[] = "o3oo8566658";

// Your network key Index number (needed only for WEP).
//int keyIndex = 0;

// Server status flag.
int status = WL_IDLE_STATUS;

// Create WiFi server listening on the given port.
WiFiServer server(3300);

void setup()
{
	// Start serial communication with the given baud rate.
	// NOTE: Remember to set the baud rate in the Serial
	// monitor to the same value.
	Serial.begin(9600);

	// Wait for serial port to connect. Needed for Leonardo only
	while (!Serial) { ; }

 
        // On the Ethernet Shield, CS is pin 4. It's set as an output by default.
        // Note that even if it's not used as the CS pin, the hardware SS pin 
        // (10 on most Arduino boards, 53 on the Mega) must be left as an output 
        // or the SD library functions will not work. 
        pinMode(10, OUTPUT);
        
        
        if (!SD.begin(4)) {
          Serial.println(F("SD card initialization failed!"));
          return;
        }

        // Check for the presence of the WiFi shield.
	if (WiFi.status() == WL_NO_SHIELD)
	{
		// If no shield, print message and exit setup.
		Serial.println(F("WiFi shield not present"));
		status = WL_NO_SHIELD;
		return;
	}

	String version = WiFi.firmwareVersion();
	if (version != "1.1.0")
	{
		Serial.println(F("Please upgrade the firmware"));
	}

	// Connect to Wifi network.
	while (status != WL_CONNECTED)
	{
		// Connect to WPA/WPA2 network. Update this line if
		// using open or WEP network.
                Serial.println(F("Connecting..."));
		status = WiFi.begin(ssid, pass);

		// Wait for connection.
		delay(1000);
        }

	// Start the server.
	server.begin();

	// Print WiFi status.
	printWifiStatus();
}

void loop()
{
        // Check that we are connected.
	if (status != WL_CONNECTED)
	{
		return;
	}
  
	// Listen for incoming client requests.
	WiFiClient client = server.available();
	if (!client)
	{
		return;
	}

	Serial.println(F("Client connected"));

	String request = readRequest(&client);
	executeRequest(&client, &request);

	// Close the connection.
	client.stop();

	Serial.println(F("Client disonnected"));
}

// Read the request line. The string from the JavaScript client ends with a newline.
String readRequest(WiFiClient* client)
{
	String request = "";

	// Loop while the client is connected.
	while (client->connected())
	{
		// Read available bytes.
		while (client->available())
		{
			// Read a byte.
			char c = client->read();

			// Print the value (for debugging).
			//Serial.write(c);

			// Exit loop if end of line.
			if ('\n' == c)
			{
				return request;
			}

			// Add byte to request line.
			request += c;
		}
	}
	return request;
}

void executeRequest(WiFiClient* client, String* request)
{
	char command = readCommand(request);
	int n = readParam(request);
	if ('R' == command)
	{
                root = SD.open("/MUSIC");
                printDirectory(client, root, 0);
	}
}

// Read the command from the request string.
char readCommand(String* request)
{
	String commandString = request->substring(0, 1);
	return commandString.charAt(0);
}

// Read the parameter from the request string.
int readParam(String* request)
{
	// This handles a hex digit 0 to F (0 to 15).
	char buffer[2];
	buffer[0] = request->charAt(1);
	buffer[1] = 0;
	return (int) strtol(buffer, NULL, 16);
}

void printWifiStatus()
{
	Serial.println(F("WiFi status"));

	// Print network name.
	Serial.print(F("  SSID: "));
	Serial.println(WiFi.SSID());

	// Print WiFi shield IP address.
	IPAddress ip = WiFi.localIP();
	Serial.print(F("  IP Address: "));
	Serial.println(ip);

	// Print the signal strength.
	long rssi = WiFi.RSSI();
	Serial.print(F("  Signal strength (RSSI):"));
	Serial.print(rssi);
	Serial.println(F(" dBm"));

}

void printDirectory(WiFiClient* client, File dir, int numTabs) {
  
        while(true) {
         
        File entry =  dir.openNextFile();
        if (! entry) {
          // no more files
          break;
        }
        Serial.println(entry.name());
        client->print(entry.name());
        client->print("\t");
        entry.close();
        }
        client->print("\n");
        client->stop();
        root.close();
}
