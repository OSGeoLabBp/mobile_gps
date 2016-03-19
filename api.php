<?php

require('GeoJSONserver.php');
$api = new GeoJSONserver(array(

  // Connection parameters
  'HOST' => 'hostname',
  'PORT' => '5432',
  'DB'   => 'database',
  'USER' => 'username',
  'PASS' => 'password',
  
  // Geometry settings
  'tableSRID' => '23700',
  'viewSRID' => '3857',
  'geomName' => 'geom',

  // List of readable tables
  // e.g.: 'tableName', ...
  'readable' => array(
      'waypoints',
      'tracks'
  ),
  
  // List of writeable tables and the required attributes
  // e.g.: 'tableName' => array('columnName:boolean|numeric|date|datetime|timestamp|json|string', ...), ...
  // when no attribute type is set, string is the default
  'writeable' => array(
      'waypoints' => array(
          'id:numeric',
          'user_id:numeric',
          'geom:json',
          'time_stamp:timestamp',
          'group_id:numeric',
          'visibility:numeric',
          'comment:string'
      ),
      'tracks' => array(
          'id:numeric',
          'user_id:numeric',
          'geom:json',
          'time_stamp:timestamp',
          'group_id:numeric',
          'visibility:numeric',
          'comment:string'
      )
  ),
  'authRequired' => true,
  'authRealm' => 'RESTAPI'
));
$api->run();
