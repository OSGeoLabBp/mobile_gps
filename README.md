Collecting GPS coordinates from mobil phones/tablets
================================================================================

Project proposal
--------------------------------------------------------------------------------

The aim of the project to create a small application to collect and
display user positions in their browser on mobile phones, tablest.
Students can understand its structure easily and can add new functionatily.

A client-server solution is planed. Client side uses HTML 5 Geolocation 
framework to get position and sends the position to server using HTTP GET, 
it is operating system independent (Android, IOS, WIN mobile).

Client side mobile phone can be substituted by NMEA ready GNSS receiver and
Ulyxes (with an iface object mimic mobile phone).

On the server side positions are collected with time stamps and user ID in a 
geodatabase (e.g PostGIS). A web map service also provided (WMS or WFS or 
non-standard AJAX).

Planned functionality
--------------------------------------------------------------------------------

* collect waypoints

  * add new waypoint to actual position
  * add new waypoint by click on the map
  * delete waypoint
  * find waypoint near to the actual position
  * export waypoints to GPX or KML (PostGIS)

* collect tracks (multi tracks paralel)

  * start tracking
  * stop tracing
  * erase track
  * export tracks to GPX or KML (PostGIS)

* center map on user position, rotate map to user direction???
* view waypoints, tracks in browser, time range selection
* acces right handling owner/registered user/other
* user registration (we don't want to serve storage to the whole world), but
  anybody can browse the map and public data

> Do we need more sophisticated acces rights?
> Should we create user groups to get more power on user separation?

Possible applications
--------------------------------------------------------------------------------

* VGI (Voluntary Geographical Information)
* Multi vehicle tracing system
* Collect sport activities (runing, cyling, etc.)
* ... ?

Software base components
--------------------------------------------------------------------------------

Client side

* HTML 5
* JavaScript/AJAX
* jQuery
* OpenLayers 2/3 (and/or Google Maps API 3?)

Server side

* PostgreSQL/PostGIS
* MapServer
* PHP or Python or node.js (?)

Database structure
--------------------------------------------------------------------------------

User table schema

* ID integer serial
* name char
* email char (?)
* password
* ... ?

Point groups schema

* ID integer serial
* name char
* description
* ... ?

Track groups schema

* ID integer serial
* name char
* description char
* ... ?

Waypoint table schema (WGS84)

* ID integer serial
* User_ID integer (foreign key to User table)
* point (GIS)
* time_stamp datetime
* group_ID (foreign key to Point groups)
* visibility (private/protected/public)
* comment char ?
* ... ?

Track table schema

* ID integer serial
* User_ID integer (foreign key to User table)
* polyline (GIS)
* time_stamp datetime
* group_ID (foreign key to Track groups)
* visibility (private/protected/public)
* comment char ?
* ... ?

.. NOTE::
   Using visibility data can be hidden. Private data are visible only for owner,
   protected data are visible for logged in users, public data are visible for
   anybody visiting the map.

.. NOTE::
   Actually waypoints and track can be assigned to one group only.
   Is it enough?

last updated: 16th august 2015
Zoltan Siki
