Collecting GPS coordinates from mobil phones/tablets
================================================================================

Project proposal
--------------------------------------------------------------------------------

The aim of the project to create a small application to collect and
display user positions in their browser on mobile phones, tablets.
It is so simple that students can understand its structure easily and can add 
new functionatily.

A client-server solution is planed. Client side uses HTML 5 Geolocation 
framework to get position and sends the position to server using HTTP GET, 
it is operating system independent (Android, IOS, WIN mobile platforms are
supported).

Client side mobile phone can be substituted by NMEA ready GNSS receiver and
Ulyxes (with an iface object mimic mobile phone, **to be developed**).

On the server side positions are collected with time stamps and user ID in a 
geodatabase (e.g. PostGIS). A web map service also provided (WMS or WFS) and/or 
non-standard AJAX queries can be used.

Planned functionality
--------------------------------------------------------------------------------

* collect waypoints

  * add new waypoint to actual position
  * add new waypoint by click on the map
  * delete waypoint
  * find waypoint near to the actual position
  * export waypoints to GPX, KML, or other formats (PostGIS, ogr2ogr)

* collect tracks (multi tracks paralel, but single track on a client device)

  * start tracking
  * stop tracing
  * erase track
  * export tracks to GPX, KML or other formats (PostGIS, ogr2ogr)

* center map on user position, rotate map to user direction???
* view waypoints, tracks in browser, time range selection
* acces right handling owner/registered users/other
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
* MapServer (WFS, WMS)
* PHP or Python or node.js (?)

Database structure
--------------------------------------------------------------------------------

*See mobil_gps.sql for the SQL script to create the database schema.*

User table schema

* ID serial primary key
* name char
* email char unique
* password MD5
* ... ?

Point groups schema

* ID serial promary key
* name char unique
* description
* ... ?

Track groups schema

* ID serial primary key
* name char unique
* description char
* ... ?

Waypoint table schema (WGS84)

* ID serial
* User_ID integer (foreign key to User table)
* point geometry
* time_stamp timestamp
* group_ID (foreign key to Point groups)
* visibility (private/protected/public)
* comment char
* ... ?

Track table schema

* ID integer serial
* User_ID integer (foreign key to User table)
* polyline geometry
* time_stamp timestamp
* group_ID (foreign key to Track groups)
* visibility (private/protected/public)
* comment char
* ... ?


> Using visibility field of track and waypoint table data can be hidden. 
> Private data are visible only for owner,
> protected data are visible for logged in users, public data are visible for
> anybody visiting the map.

> Actually waypoints and track can be assigned to one group only.
> Is it enough?

last updated: 24th august 2015
Zoltan Siki
