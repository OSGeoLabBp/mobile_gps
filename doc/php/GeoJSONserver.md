# Mobile GPS Project Documentation

## GeoJSONserver.php

----------- | --------------------
name        | GeoJSONserver - PostGIS-GeoJSON RESTful API in PHP
version     | 1.0
description | RESTful PHP library for PostgreSQL CRUD functions. Read, delete, update and insert sanitized data with GeoJSON format into PostGIS table. Suitable for use in OpenLayers, Leaflet, etc.
author      | Gergő Gelencsér (http://github.com/programmerg)
license     | GNU GENERAL PUBLIC LICENSE v2
link        | https://github.com/OSGeoLabBp/mobile_gps


### OPTIONS - Basic example

```php
<?php
require('path/to/GeoJSONserver.php');
$api = new GeoJSONserver(array(
  // Connection parameters
  'HOST' => 'localhost',
  'PORT' => '5432',
  'DB'   => 'mobile_gps',
  'USER' => 'postgres',
  'PASS' => '',
  // Geometry settings
  'tableSRID' => '4326',
  'viewSRID' => '3857',
  'geomName' => 'geom',
  // List of readable tables
  // e.g.: 'tableName', ...
  'readable' => array(
      'waypoints',
      ...
  ),
  // List of writeable tables and the required attributes
  // e.g.: 'tableName' => array('columnName:boolean|numeric|date|datetime|timestamp|json|string', ...), ...
  // when no attribute type is set, string is the default
  'writeable' => array(
      'waypoints' => array(
          'id:numeric',
          'geom:json',
          'time_stamp:timestamp',
          'comment:string'
      ), ...
  ),
  'authRequired' => false,
  'authRealm' => 'mobile_gps'
));
$api->start();
?>
```

### METHODS

`public start()`
Handle CRUD actions using HTTP methods mapped as follows:
GET - used for basic READ requests to the server
POST - used to CREATE a new object on the server
PUT - used to modify (UPDATE) an existing object on the server
DELETE - used to remove (DELETE) an object on the server

`protected response($data, $code = 200)`
Write the response to the output in json format with optional HTTP satus codes
type | name | description
`mixed` | `$data` | this will be the output in json format
`integer` | `$code` | optional HTTP status code default 200

`protected authenticate($realm = '')`
Basic HTTP authentication
type | name | description
`string` | `$realm` | 

`public read($table, $id = '', $request = '', $opt_options = '')`
READ records from table
type | name | description
`string` | `$table` | table name
`integer` | `$id` | optional ID of record
`array` | `$request` | optional parameters from user like bbox
`array` | `$opt_options` | optional parameters overriding defaults
Returns: `array` in geojson structure

`public create($table, $request, $opt_options = '')`
INSERT record into table
type | name | description
`string` | `$table` | table name
`array` | `$request` | requested values from user
`array` | `$opt_options` | optional parameters overriding defaults
Returns: `boolean|array` ID of inserted record or false on error

`public update($table, $id, $request, $opt_options = '')`
UPDATE record in table
type | name | description
`string` | `$table` | table name
`integer` | `$id ID` | of record
`array` | `$request` | requested values from user
`array` | `$opt_options` | optional parameters overriding defaults
Returns: `boolean|array` affected row count or false on error

`public delete($table, $id, $opt_options = '')`
DELETE record from table
type | name | description
`string` | `$table` | table name
`integer` | `$id` | ID of record
`array` | `$opt_options` | optional parameters overriding defaults
Returns: `boolean|array` affected row count or false on error

`protected bindParamFromRequest(&$query, $parameter, $request, $data_type = 'string')`
Cleans a request parameter and binds to the specified variable name
type | name | description
`PDOStatement` | `$query` | PDO statement handler
`string` | `$parameter` | the name of the parameter
`array` | `$request` | the request array, e.g.: $_POST
`string` | `$data_type` | optional data type, default is string
Returns: `boolean` result of the original bindParam method
