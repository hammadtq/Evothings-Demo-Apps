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
// Hammad Tariq, Evothings AB
//
// This example shows how to get distance data from SR-HC04
// ultrasonic module and pass it to an external application
// using Scratch data.
//
//

String beanName = "LightBlueBean";
const uint8_t writeScratch = 1;
int vcc = 0; //attach pin 2 to vcc
int trig = 1; // attach pin 3 to Trig
int echo = 2; //attach pin 4 to Echo
int gnd = 3; //attach pin 5 to GND

void setup() {
  // Setup bean
  Bean.setBeanName(beanName);
  Bean.enableWakeOnConnect(true);

  pinMode (vcc,OUTPUT);
  pinMode (gnd,OUTPUT);
}

// the loop routine runs over and over again forever:
void loop() {
  bool connected = Bean.getConnectionState();

  if(connected) {
    // Write current distance to a scratch data area.
    uint8_t distanceBuffer[2];
    digitalWrite(vcc, HIGH);
    // establish variables for duration of the ping,
    // and the distance result in inches and centimeters:
    long duration, inches, cm;
    
    // The PING))) is triggered by a HIGH pulse of 2 or more microseconds.
    // Give a short LOW pulse beforehand to ensure a clean HIGH pulse:
    pinMode(trig, OUTPUT);
    digitalWrite(trig, LOW);
    delayMicroseconds(2);
    digitalWrite(trig, HIGH);
    delayMicroseconds(5);
    digitalWrite(trig, LOW);
    
    // Read the reception of returning ping from echo pin
    // that is our distance
    pinMode(echo,INPUT);
    duration = pulseIn(echo, HIGH);
    
    // convert the time into a distance
    distanceBuffer[0] = microsecondsToInches(duration);
    distanceBuffer[1] = microsecondsToCentimeters(duration);
    Bean.setScratchData(writeScratch, distanceBuffer, 2);
    delay(100);
    }
    else {
      // Turn LED off and put to sleep.
      Bean.setLed(0, 0, 0);
      Bean.sleep(0xFFFFFFFF);
    }
}
long microsecondsToInches(long microseconds)
{
// According to Parallax's datasheet for the PING))), there are
// 73.746 microseconds per inch (i.e. sound travels at 1130 feet per
// second). This gives the distance travelled by the ping, outbound
// and return, so we divide by 2 to get the distance of the obstacle.
// See: http://www.parallax.com/dl/docs/prod/acc/28015-PI...
return microseconds / 74 / 2;
}

long microsecondsToCentimeters(long microseconds)
{
// The speed of sound is 340 m/s or 29 microseconds per centimeter.
// The ping travels out and back, so to find the distance of the
// object we take half of the distance travelled.
return microseconds / 29 / 2;
}

