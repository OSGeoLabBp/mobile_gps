
// Define Hungaryan projection system EPSG:23700
proj4.defs("EPSG:23700","+proj=somerc +lat_0=47.14439372222222 	+lon_0=19.04857177777778 +k_0=0.99993 +x_0=650000 +y_0=200000 +ellps=GRS67 	+towgs84=52.17,-71.82,-14.9,0,0,0,0 +units=m +no_defs");

// Instanciate a Map, set the object target to the map DOM id
var map = new ol.Map({
  target: 'map',
  view: new ol.View({
    projection: 'EPSG:3857',
    center: ol.proj.transform([653206, 246469], 'EPSG:23700', 'EPSG:3857'),
    zoom: 8,
    rotation: 0
  }),
  controls: [
    new ol.control.Zoom(),
    new ol.control.ZoomSlider(),
    new ol.control.Rotate(),
    new ol.control.ScaleLine(),
    /*new ol.control.MousePosition({
      projection: ol.proj.get('EPSG:23700'),
      coordinateFormat: ol.coordinate.createStringXY(3)
    })*/
  ]
});

// Declare a Tile layer with an OSM source
var osmLayer = new ol.layer.Tile({
  source: new ol.source.OSM()
});
map.addLayer(osmLayer);

// Waypoints layer
var WaypointsLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'api/waypoints',
    format: new ol.format.GeoJSON({ defaultDataProjection: 'EPSG:3857', geometryName: 'geom' })
  }),
  style: (function (feature, resolution) {
    var label = feature.get('comment') || '';
    return new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'black'
        }),
        radius: 5
      }),
      text: new ol.style.Text({
        fill: new ol.style.Fill({
          color: 'black'
        }),
        text: label
      })
    });
  })
});
map.addLayer(WaypointsLayer);

// Tracks layer
var TracksLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'api/tracks',
    format: new ol.format.GeoJSON({ defaultDataProjection: 'EPSG:3857', geometryName: 'geom' })
  }),
  style: (function (feature, resolution) {
    var label = feature.get('comment') || '';
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

// Sketch layer
var sketchItems = new ol.Collection();
var sketchLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: sketchItems
  }),
  style: (function (feature, resolution) {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'yellow'
      }),
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'yellow'
        }),
        radius: 5
      }),
      stroke: new ol.style.Stroke({
        color: 'yellow',
        width: 1
      })
    });
  })
});
map.addLayer(sketchLayer);


var modifyInteraction = new ol.interaction.Modify({
  features: sketchItems,
  deleteCondition: function(event) {
    return ol.events.condition.shiftKeyOnly(event) &&
        ol.events.condition.singleClick(event);
  }
});
modifyInteraction.on('modifyend', saveItem);
map.addInteraction(modifyInteraction);

function saveItem(evt){
  var feature = (evt.features !== undefined) ? evt.features.item(0) : evt.feature;
  var geojson = new ol.format.GeoJSON();
  var geom = geojson.writeGeometry(feature.getGeometry());
  var id = feature.get('id');
  $.ajax({
    method: 'PUT', // POST, DELETE
    url: 'api/tracks/' + id,
    dataType: 'json',
    data: {geom: geom, group_id: 0, visibility: 0, comment: ''},
    success: function(data, textStatus, xhr){
      alert(data.id || data.rowCount);
    },
    error: function (xhr, textStatus, error){
      alert(textStatus);
    }
  });
}



// LineString to store the different geolocation positions.
// The Z dimension is actually used to store the rotation (heading).
var positions = new ol.geom.LineString([], ('XYZM'));
var deltaMean = 500; // the geolocation sampling period mean in ms

// Geolocation Control
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
  var heading = geolocation.getHeading() || 0;
  var speed = geolocation.getSpeed() || 0;
  var m = Date.now();

  addPosition(position, heading, m, speed);

  var coords = positions.getCoordinates();
  var len = coords.length;
  if (len >= 2) {
    deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
  }

  /*
  var html = [
    'Position: ' + position[0].toFixed(2) + ', ' + position[1].toFixed(2),
    'Accuracy: ' + accuracy,
    'Heading: ' + Math.round(radToDeg(heading)) + '&deg;',
    'Speed: ' + (speed * 3.6).toFixed(1) + ' km/h',
    'Delta: ' + Math.round(deltaMean) + 'ms'
  ].join('<br />');
  */
});
geolocation.on('error', function() {
  alert('Please enable the Geolocation API!');
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

function addPosition(position, heading, m, speed) {
  var x = position[0];
  var y = position[1];
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
  positions.appendCoordinate([x, y, heading, m]);

  // only keep the 20 last coordinates
  positions.setCoordinates(positions.getCoordinates().slice(-20));

  // FIXME use speed instead
  if (heading && speed) {
    markerEl.src = 'data/geolocation_marker_heading.png';
  } else {
    markerEl.src = 'data/geolocation_marker.png';
  }
}

var previousM = 0;
// change center and rotation before render
map.beforeRender(function(map, frameState) {
  if (frameState !== null) {
    // use sampling period to get a smooth transition
    var m = frameState.time - deltaMean * 1.5;
    m = Math.max(m, previousM);
    previousM = m;
    // interpolate position along positions LineString
    var c = positions.getCoordinateAtM(m, true);
    var view = frameState.viewState;
    if (c) {
      view.center = getCenterWithHeading(c, -c[2], view.resolution);
      view.rotation = -c[2];
      marker.setPosition(c);
    }
  }
  return true; // Force animation to continue
});

// recenters the view by putting the given coordinates at 3/4 from the top or
// the screen
function getCenterWithHeading(position, rotation, resolution) {
  var size = map.getSize();
  var height = size[1];
  return [
    position[0] - Math.sin(rotation) * height * resolution * 1 / 4,
    position[1] + Math.cos(rotation) * height * resolution * 1 / 4
  ];
}

// postcompose callback
function render() {
  map.render();
}

// geolocate device

var geolocateDiv = document.createElement('div');
geolocateDiv.className = 'ol-geolocate ol-unselectable ol-control';
var geolocateButton = document.createElement('button');
geolocateButton.title = 'Set tracking on/off';
geolocateButton.textContent = 'G';
geolocateButton.addEventListener('click', function() {
  geolocation.setTracking(true); // Start position tracking
  map.on('postcompose', render);
  map.render();
}, false);
geolocateDiv.appendChild(geolocateButton);
document.getElementsByClassName('ol-overlaycontainer-stopevent')[0].appendChild(geolocateDiv);
