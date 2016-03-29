# Mobile GPS Project

Collecting GPS coordinates from mobil phones/tablets

## Project proposal

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

Further development direction to use other sensores of mobile device, orientation 
and motion. It can be used for indoor navigation and step counting.

Try the [online demo](https://rawgit.com/OSGeoLabBp/mobile_gps/master/client/index.html) or download
the [latest stable release](http://github.com/OSGeoLabBp/mobile_gps/archive/master.zip)!

## Features

* view waypoints and tracks in browser
* add new waypoint to actual position
* collect multiple tracks with start and stop tracking
* store waypoints and tracks in PostGIS database
* delete waypoints and erase tracks
* center and rotate map along tracks

## Future plans

* add new waypoint by click on the map
* export/import waypoints in popular formats (GPX, KML, GeoJSON)
* time range selection
* UNM MapServer / GeoServer (WFS, WMS) support
* Python and/or Node.js API
* user registration or Facebook login with OAuth2
* acces right handling

> * Do we need more sophisticated acces rights?
> * Should we create user groups to get more power on user separation?

## Possible applications

* VGI (Voluntary Geographical Information)
* Multi vehicle tracing system
* Collect sport activities (runing, cycling, etc.)
* ... ?

Concrete application plans

* Bicycle parking places/Bubi stations
* Blue parking (CLGE project to collect parking place positions for handicapped people)

## Software components

Client side

* HTML5 & CSS3 UI based on the responsive [Bootstrap 3](http://getbootstrap.com/) framework
* JavaScript (ES5), [jQuery](http://jquery.com) and AJAX
* [OpenLayers 3](http://openlayers.org/) mapping library with [Geolocation API](http://openlayers.org/en/master/apidoc/ol.Geolocation.html)

> * sensor widgets http://blog.geomati.co/post/128324865623/sensor-widgets-monitor-your-real-time-sensor-data ???
> * DeviceOrientation event (http://goo.gl/wA1FAA)
> * DeviceMotion event (http://goo.gl/nEAOlg) http://www.html5rocks.com/en/tutorials/device/orientation

Server side

* PHP5 RESTful API
* PostgreSQL database with PostGIS geospatial extension

> * MapServer (WFS, WMS) (?)
> * Python or node.js (?)
> * SOS server ???

## Database structure

See [server/db\_schema.sql](server/db_schema.sql) for the SQL script to create the database schema.

> Using visibility field of track and waypoint table data can be hidden. 
> Private data are visible only for owner,
> protected data are visible for logged in users, public data are visible for
> anybody visiting the map.

> Actually waypoints and track can be assigned to one group only.
> Is it enough?

Zoltan Siki

## Documentation

See quick summary in the [doc](doc/) folders or check out the well-documented source files.

The original OpenLayers 3 API documentation can be found [here](http://openlayers.org/en/master/apidoc/), and a lot of examples can be found [here](http://openlayers.org/en/master/examples/).

## Joinnig the project

Volunters are welcome! 

If you would like to connect the project as a developer, a tester or a document writer then

- make a GitHub account if you have not created one before
- install a git client to your computer (Linux or Windows)
- fork the mobile_gps project into your repository
- clone the project from GitHub to your local machine
- build a [test anvironment](http://www.osgeo.org) (Apache, PostgreSQL)
- send us pull requests or [issues](https://github.com/OSGeoLabBp/mobile_gps/issues) on GitHub

## License

This project is licensed under the [GNU GENEREAL PUBLIC LICESNSE V2](LICENSE).