---
title: "Boilerplate for tracking apps"
author: "Francesco Pirotti"
date: "2023-02-05" 
---


# Boilerplate for tracking apps

A tracking app in javascript with several advantages with 
respect to alternatives in JAVA / Android Studio.

[GOTO APP]("https://www.cirgeo.unipd.it/varcities/index.html")

Advantages:

 - it is quite cross-platform
 - easy to install
 - does not require to connect to Google Play or APKs to install
 - works offline by caching a very small footprint of location data

Disadvantages:

 - less robust when missing internet connection
 - if user shuts off the screen, coordinates 
are not recorded anymore - depending on the 
browser the APP will try to disable the  screen sleeping
mode, but if the user proactively shuts off the screen,
the coordinates are not recorded anymore, thus data
are lost. 


## Usage

Simple start tracking by clicking the button - you can 
stop by long-pressing the button for at least 2 seconds. This
avoids stopping by mistake the tracking by touching the button.

<mark>NB - you must keep the app and screen on to successfully 
record the data</mark>

Upon stopping the recording, your data will be saved to the phone as
compressed (ZIP) GeoJSON format. You can share this file to 
a PC or other devices by going to the download .

## Short description

It is based on PWA so it can be installed as an APP in the smartphone 
and run without internet connection.

It allows catching coordinates around every second* (tracking) 
and geotagged images.

Tracking will send data to a server 
in real-time 
if there is an internet connection.

The app will save the positions into the  phone and save the final track 
as geoJSON in the phone once tracking is stopped. 

The saved file is in compressed GeoJSON format (zip). 
The phone apps can open the GeoJSON with QField or other
GIS apps that recognize the format. The zipped GeoJSON file can be shared 
via email or social media for easy data transfer. 

The locations are synced with the server. Each phone/app 
has a unique ID. NB the unique ID is 
a 10 character random hash created from the client 
browser, **it is NOT the phone ID or a fingerprint**.

The app must be active to track location. 
For this the screen is locked to avoid sleep mode,
but if the user changes page or app, the recording will stop.
Because of this, the app has a minimal battery footprint to 
minimize battery usage.

### Photoes

User can snap new photos or upload existing photos,
the APP will double-check that they are GeoTagged correctly
and provide alerts in case your camera is not enabled to 
geotag images.

_TBD - The photo will be uploaded to the server if there is
internet connection, otherwise it will be cached and synced 
the next time that the APP is started and internet connection
is detected._

### Other technical info

For maximum efficiency, data is transferred over the internet
as tiny binary arrays. Tracking data are transferred as four
32bit  unsigned 32 bits integers, with a header, as described below:

- **HEADER**
  - **UID** Unique ID of device - string with 10 characters _(10x1 Bytes)_
  - **Start Time** BigInt64bits _(1x8 Bytes)_
- **DATA**
  - **timestamp** in milliseconds  from start of recording, in INT32 _(1x4 Bytes)_
  - **latitude** and **longitude** are multiplied by 10000000 (1E7) to 
  keep submetric resolution on the INT32 integer size _(2x4 Bytes)_
  - **accuracy** resolution is stored in centimeters  _(1x4 Bytes)_

The header is used to fix the file name using
the following format: 
YYYYMMDD_HHmmSS.bin 

**Example:** 
a track started at 10:01:45 
on the 30th of February 2022 
on device "_xxxaaa111b_" will 
be saved in folder _xxxaaa111b_
in file 
_20221230_100145.bin_ and data will be a raw array of the **DATA**
chunk described above.