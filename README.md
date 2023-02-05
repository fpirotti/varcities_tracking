# Boilerplate for tracking apps

A tracking app in javascript with several advantages with 
respect to alternatives in JAVA / Android Studio.

Advantages:

 - it is quite cross-platform
 - does not require to connect to Google Play or APKs to install
 - 

Disadvantages:

 - less robust when missing internet connection
 - if user shuts off the screen, coordinates 
are not recorded anymore - depending on the 
browser the APP will try to disable the  screen sleeping
mode, but if the user proactively shuts off the screen,
the coordinates are not recorded anymore, thus data
are lost. 



## Short description

It is based on PWA so it can be installed as an APP in the smartphone.

It allows catching coordinates every second (tracking) 
and geotagged images.

Tracking will send data to a server 
in real-time 
if there is an internet connection. 

With or without internet connection, the app will save the position 
every second and will allow use to save to phone the final track once
tracking is stopped. 

The saved file is in compressed GeoJSON format (zip). 
The phone apps can open the GeoJSON with QField or other
GIS apps that recognize the format. 

The file can be shared 
via email or social media for easy data transfer. 

The GeoJSON files are synced with the server. Each phone/app 
has a unique ID. NB the unique ID is 
a random hash created from the client 
browser, it is NOT the phone ID or a fingerprint.


### Photoes

User can snap new photoes or upload existing photoes,
the APP will double check that they are GeoTagged correctly.

The photo will be uploaded to the server if there is
internet connection, otherwise it will be cached and synced 
the next time that the APP is started and internet connection
is detected.

### Other technical info

For maximum efficiency, data transferred over the internet
is in binary format. Tracking data are transferred as 
32bit  Unsigned integers, 

 - **latitude** and **longitude** are multiplied by 10000000 (1E7) to 
keep submetric resolution on the UINT32 integer.
 - **timestamp** in milliseconds  from start of recording
 - **accuracy** is in centimeters