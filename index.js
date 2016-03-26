/*
 * MAP OBJECT WITH LAYERS, PROJECTIONS AND DEFAULT CONTROLS
 */

// Define national projection system
// EPSG:4326 and EPSG:3857 already defined in OpenLayers
proj4.defs("EPSG:23700","+title=HD72 EOV +proj=somerc +lat_0=47.14439372222222 +lon_0=19.04857177777778 +k_0=0.99993 +x_0=650000 +y_0=200000 +ellps=GRS67 +towgs84=52.17,-71.82,-14.9,0,0,0,0 +units=m +no_defs");
var eov = new ol.proj.Projection({
  code: 'EPSG:23700',
  extent: [421391.21, 48212.58, 934220.63, 366660.88],
  worldExtent: [16.11, 45.74, 22.9, 48.58]
});

// Instanciate a Map, set the object target to the map DOM id
var map = new ol.Map({
  target: 'map',
  view: new ol.View({
    projection: 'EPSG:3857',
    extent: ol.proj.get('EPSG:3857').getExtent(),
    center: ol.proj.transform([653206, 246469], 'EPSG:23700', 'EPSG:3857'),
    zoom: 8,
    rotation: 0
  }),
  controls: [
    new ol.control.Zoom(),
    //new ol.control.ZoomSlider(),
    new ol.control.Rotate(),
    new ol.control.ScaleLine(),
    new ol.control.MousePosition({
      className: 'ol-mouse-position ol-control ol-unselectable',
      projection: ol.proj.get('EPSG:4326'),
      coordinateFormat: ol.coordinate.toStringHDMS
      // ol.coordinate.createStringXY(3) for EPSG:23700
    })
  ] //, layers: [], interactions: [], overlays: [] // defined below
});

// Declare a Tile layer with an OSM source
var osmLayer = new ol.layer.Tile({
  source: new ol.source.OSM()
});
map.addLayer(osmLayer);

// Declare a Vector layer with waypoints from database
var waypointFeatures = new ol.Collection();
var WaypointsLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: waypointFeatures, // so we can direct access it
    format: new ol.format.GeoJSON({
      defaultDataProjection: 'EPSG:3857',
      geometryName: 'geom'
    }),
    url: 'api/waypoints'
//  In case of large datasets Tiled loading is wery useful
//  url: (function(extent, resolution, projection){
//    return 'api/waypoints'+ '?bbox=' + extent.join(',');
//  }),
//  strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
//    maxZoom: 19,
//    tileSize: [256, 256]
//  }))
  }),
  style: (function (feature, resolution) {
    var label = feature.get('time_stamp') || '';
    return new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'black'
        }),
        radius: 5
      }),
      text: new ol.style.Text({
        offsetY: -12,
        fill: new ol.style.Fill({
          color: 'black'
        }),
        text: label
      })
    });
  })
});
map.addLayer(WaypointsLayer);

// Declare a Vector layer with tracks from database
var trackFeatures = new ol.Collection();
var TracksLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: trackFeatures, // so we can direct access it
    format: new ol.format.GeoJSON({
      defaultDataProjection: 'EPSG:3857',
      geometryName: 'geom'
    }),
    url: 'api/tracks'
  }),
  style: (function (feature, resolution) {
    var label = Math.round(feature.getGeometry().getLength() || '0') + ' m';
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'blue',
        width: 1
      }),
      text: new ol.style.Text({
        fill: new ol.style.Fill({
          color: 'blue'
        }),
        text: label
      })
    });
  })
});
map.addLayer(TracksLayer);


/*
 * HANDLE USER ACTIONS WITH INTERACTIONS, OVERLAYS AND CONTROLS
 */

// Feature info overlay for selection
var featureInfo = new ol.Overlay({
  positioning: 'center-center',
  element: document.createElement('div'),
  stopEvent: false
});
map.addOverlay(featureInfo);

// Select interaction
var selectedFeatures = new ol.Collection();
var selectInteraction = new ol.interaction.Select({
  layers: [TracksLayer, WaypointsLayer],
  features: selectedFeatures
});
selectInteraction.on('select', function(evt){
  console.log(evt);
  var feature = evt.selected[0];
  var html = [
    'ID: ' + feature.get('id'),
    'Time: ' + feature.get('time_stamp'),
    'Group ID: ' + feature.get('group_id'),
    'Visibility: ' + feature.get('visibility'),
  ].join('<br>');
  
  var coordinate;
  if (feature.getGeometry() instanceof ol.geom.LineString) {
    coordinate = feature.getGeometry().getCoordinateAt(0.5);
  } else {
    coordinate = feature.getGeometry().getFirstCoordinate();
  }
  featureInfo.setPosition(coordinate);
  
  // Bootstrap popover
  var bsPopover = featureInfo.getElement();
  $(bsPopover).popover('destroy');
  $(bsPopover).popover({
    'placement': 'top',
    'animation': false,
    'html': true,
    'content': html
  });
  $(bsPopover).popover('show');
  map.on('click', function(){ 
    $(bsPopover).popover('destroy');
  });
});
map.addInteraction(selectInteraction);

// Modify Interaction - modify features on the map and database also
var modifyInteraction = new ol.interaction.Modify({
  features: selectedFeatures,
  deleteCondition: function(event) {
    return ol.events.condition.shiftKeyOnly(event) &&
        ol.events.condition.singleClick(event);
  }
});
modifyInteraction.on('modifyend', function(evt){
  evt.features.forEach(function(feature){
    if (feature.getGeometry() instanceof ol.geom.LineString) {
      dbQuery('update', 'tracks/' + feature.get('id'), feature);
      // TODO reverse function on DB error
    } else {
      dbQuery('update', 'waypoints/' + feature.get('id'), feature);
      // TODO reverse function on DB error
    }
  });
});
map.addInteraction(modifyInteraction);


// Save (create) control button
var saveDiv = document.createElement('div');
saveDiv.className = 'ol-save-feature ol-unselectable ol-control';
var saveButton = document.createElement('button');
saveButton.title = 'Save tracks and waypoints';
saveButton.textContent = 'S';
saveButton.className = '';
saveButton.addEventListener('click', function() {
  // when feature has no id, then this is a new feature
  waypointFeatures.forEach(function(feature){
    if (feature.get('id') === undefined) {
      dbQuery('create', 'waypoints', feature, function(data){
        feature.set('id', data.id); // prevent infinite insert loops
      });
    }
  });
  trackFeatures.forEach(function(feature){
    if (feature.get('id') === undefined) {
      dbQuery('create', 'tracks', feature, function(data){
        feature.set('id', data.id); // prevent infinite insert loops
      });
    }
  });
}, false);
saveDiv.appendChild(saveButton);
//map.getViewport().appendChild(saveDiv);
var saveControl = new ol.control.Control({element: saveDiv});
map.addControl(saveControl);


// Delete control button
var deleteDiv = document.createElement('div');
deleteDiv.className = 'ol-delete-feature ol-unselectable ol-control';
var deleteButton = document.createElement('button');
deleteButton.title = 'Delete selected features';
deleteButton.textContent = 'X';
deleteButton.className = '';
deleteButton.addEventListener('click', function() {
  if (confirm('The selected feature(s) will be removed. Are you sure?')) {
    selectedFeatures.forEach(function(feature){
      if (feature.getGeometry() instanceof ol.geom.LineString) {
        dbQuery('delete', 'tracks/' + feature.get('id'), null, function(){
          trackFeatures.remove(feature);
        });
      } else {
        dbQuery('delete', 'waypoints/' + feature.get('id'), null, function(){
          waypointFeatures.remove(feature);
        });
      }
    });
  }
}, false);
deleteDiv.appendChild(deleteButton);
//map.getViewport().appendChild(deleteDiv);
var deleteControl = new ol.control.Control({element: deleteDiv});
map.addControl(deleteControl);


// Function to handle AJAX requests
function dbQuery(method, url, feature, callback) {
  var methodArray = {read: 'GET', create: 'POST', update: 'PUT', delete: 'DELETE'};
  method = methodArray[method] || 'GET';
  var data = undefined;
  if (feature instanceof ol.Feature) {
    var geojson = new ol.format.GeoJSON();
    data = feature.getProperties();
    data.geom = geojson.writeGeometry(feature.getGeometry());
  }
  $.ajax({
    url: url,
    data: data,
    method: method,
    dataType: 'json', // response
    success: function(data, textStatus, xhr){
      if (typeof callback === 'function') {
        callback(data);
      }
      // We have data.id or data.rowCount
      // but only bad news is real news...
      if (data.message) {
        alert(data.message);
      }
    },
    error: function (xhr, textStatus, error){
      alert(textStatus);
    }
  });
}


/*
 * GEOLOCATION API
 * http://openlayers.org/en/master/apidoc/ol.Geolocation.html
 * http://www.w3.org/TR/geolocation-API/
 */

// LineString to store the different geolocation positions.
// The Z dimension is actually used to store the rotation (heading).
var positions = new ol.geom.LineString([], ('XYZM'));
var deltaMean = 500; // the geolocation sampling period mean in ms

// Geolocation accuracy feature
var geolocationAccuracy = new ol.Feature();
var geolocationLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [geolocationAccuracy]
  })
});

// Geolocation marker
var geolocationMarker = new ol.Overlay({
  positioning: 'center-center',
  element: document.createElement('div'),
  stopEvent: false
});

// Geolocation info
var geolocationInfoDiv = document.createElement('div');
geolocationInfoDiv.className = 'ol-geolocation-info ol-unselectable ol-control';
//map.getViewport().appendChild(geolocationInfoDiv);
var geolocationInfoControl = new ol.control.Control({element: geolocationInfoDiv});
map.addControl(geolocationInfoControl);

// Geolocation class
var geolocation = new ol.Geolocation({
  projection: map.getView().getProjection(),
  trackingOptions: {
    maximumAge: 10000,
    enableHighAccuracy: true,
    timeout: 600000
  }
});

// Listen to position changes
geolocation.on('change', function() {
  var position = geolocation.getPosition();
  var accuracy = geolocation.getAccuracy();
  var accuracyGeometry = geolocation.getAccuracyGeometry();
  var heading = geolocation.getHeading() || 0;
  var speed = geolocation.getSpeed() || 0;
  var m = Date.now();

  var fCoords = positions.getCoordinates();
  var previous = fCoords[fCoords.length - 1];
  var prevHeading = previous && previous[2];
  if (prevHeading) {
    var headingDiff = heading - mod(prevHeading);
    // force the rotation change to be less than 180°
    if (Math.abs(headingDiff) > Math.PI) {
      var sign = (headingDiff >= 0) ? 1 : -1;
      headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
    }
    heading = prevHeading + headingDiff;
  }
  positions.appendCoordinate([position[0], position[0], heading, m]);
  
  if (heading && speed) {
    geolocationMarker.getElement().className = 'ol-geolocation-marker heading';
  } else {
    geolocationMarker.getElement().className = 'ol-geolocation-marker';
  }
  
  // we have the last track since geolocationButton click event fired
  var lastTrack = trackFeatures.pop();
  lastTrack.setGeometry(positions);
  trackFeatures.push(lastTrack);
  var newWaypoint = new ol.Feature({
    'geometry': new ol.geom.Point(position),
    'time_stamp': new Date().toISOString(),
    'group_id': 0,
    'visibility': 0
  });
  waypointFeatures.push(newWaypoint);
  geolocationAccuracy.setGeometry(accuracyGeometry);
  
  var coords = positions.getCoordinates();
  var len = coords.length;
  if (len >= 2) {
    deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
  }
  var positionWGS87 = ol.proj.transform(position,'EPSG:3857','EPSG:4326');
  var html = [
    'Position: ' + ol.coordinate.toStringHDMS(positionWGS87, 2),
    'Accuracy: ' + accuracy + ' m',
    'Heading: ' + Math.round(radToDeg(heading)) + '&deg;',
    'Speed: ' + (speed * 3.6).toFixed(1) + ' km/h',
    'Delta: ' + Math.round(deltaMean) + 'ms'
  ].join('<br>');
  geolocationInfoDiv.innerHTML = html;
});
geolocation.on('error', function(error) {
  alert(error.message);
});

// convert radians to degrees
function radToDeg(rad) {
  return rad * 360 / (Math.PI * 2);
}
// convert degrees to radians
function degToRad(deg) {
  return deg * Math.PI * 2 / 360;
}
// modulo for negative values
function mod(n) {
  return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
}

// change center and rotation before render
// TODO or use the geolocationMarker autoPan option with autoPanAnimation
var previousM = 0;
map.beforeRender(function(map, frameState) {
  if (geolocateButton.className === 'active' && frameState !== null) {
    // use sampling period to get a smooth transition
    var m = frameState.time - deltaMean * 1.5;
    m = Math.max(m, previousM);
    previousM = m;
    // interpolate position along positions LineString
    var c = positions.getCoordinateAtM(m, true);
    console.log(positions);
    if (c) {
      // Recenters the view by putting the given coordinates
      // at 3/4 from the top or the screen.
      var view = frameState.viewState;
      var mapSize = map.getSize();
      var rotation = -c[2];
      var center = [
        c[0] - Math.sin(rotation) * mapSize[1] * view.resolution * 1 / 4,
        c[1] + Math.cos(rotation) * mapSize[1] * view.resolution * 1 / 4
      ];
      console.log(c);
      console.log(center);
      view.center = center;
      view.rotation = rotation;
      geolocationMarker.setPosition(c);
    }
  }
  return true; // Force animation to continue
});
map.on('postcompose', function(){ map.render(); });

// Geolocation control button
var geolocateDiv = document.createElement('div');
geolocateDiv.className = 'ol-geolocate ol-unselectable ol-control';
var geolocateButton = document.createElement('button');
geolocateButton.title = 'Set tracking on / off';
geolocateButton.textContent = 'G';
geolocateButton.className = '';
geolocateButton.addEventListener('click', function() {
  if (geolocateButton.className != 'active') {
    geolocateButton.className = 'active';
    geolocationInfoDiv.innerHTML = '';
    var newTrack = new ol.Feature({
      'geometry': new ol.geom.LineString([]),
      'time_stamp': new Date().toISOString(),
      'group_id': 0,
      'visibility': 0
    });
    trackFeatures.push(newTrack);
    geolocation.setTracking(true); // Start position tracking
    map.addOverlay(geolocationMarker);
    map.addLayer(geolocationLayer);
    map.render();
  } else {
    geolocateButton.className = '';
    geolocationInfoDiv.innerHTML = '';
    geolocation.setTracking(false); // Stop position tracking
    map.removeOverlay(geolocationMarker);
    map.removeLayer(geolocationLayer);
    map.render();
  }
}, false);
geolocateDiv.appendChild(geolocateButton);
//map.getViewport().appendChild(geolocateDiv);
var geolocateControl = new ol.control.Control({element: geolocateDiv});
map.addControl(geolocateControl);