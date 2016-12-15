var geocoded = false;
var parking_table ='parking_location';
var sharrows_table ='sharrows';
function initMap() {
  var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
  var icons = {
    parking: {
      icon: iconBase + 'parking_lot_maps.png'
    },
    library: {
      icon: iconBase + 'library_maps.png'
    },
    info: {
      icon: iconBase + 'info-i_maps.png'
    }
  };
  elevator = new google.maps.ElevationService();

  map = new google.maps.Map(document.getElementById('map'), {
    // Zoom on the city of worcester
    zoom: 13,
    center: {lat: 42.26, lng: -71.8},
    mapTypeId: 'terrain'
  });

  initAutoComplete('start_address');
  initAutoComplete('end_address');
  var geocoder = new google.maps.Geocoder();
  var trafficLayer = new google.maps.TrafficLayer();
  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(map);
  document.getElementById('traffic_radio').onclick = function() {
    bikeLayer.setMap(null);
    trafficLayer.setMap(map);
  }
  document.getElementById('bike_radio').onclick = function() {
    trafficLayer.setMap(null);
    bikeLayer.setMap(map);
  }
  document.getElementById('terrain_check').onclick = function() {
    map.setMapTypeId(document.getElementById('terrain_check').checked ? 'terrain' : 'roadmap');
  }

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYLINE,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYLINE
      ]
    },
    polylineOptions: {
      strokeColor: '#696969',
      strokeWeight: 2
    }
  });
  var placingListener;
  document.getElementById('edit_mode').addEventListener('change', function() {
    if (this.value == 'view') {
      placingListener.remove();
      drawingManager.setMap(null);
    } else if (this.value == 'parking') {
      placingListener = google.maps.event.addListener(
          map, 'click', function(event) { placeMarker(event.latLng, -1, null); });
      drawingManager.setMap(null);
    } else if (this.value == 'roads') {
      if (placingListener) {
        placingListener.remove();
      }
      drawingManager.setMap(map);
    }
  });

  drawingManager.addListener('polylinecomplete', function(poly) {
    var path = poly.getPath();
    snapToRoad(path);
    poly.setMap(null);
  });

  var markerInc = 0;
  function placeMarker(location, id, notes) {
    var marker = new google.maps.Marker({
      position: location,
      map: map,
      icon: icons['parking'].icon,
      draggable: false // TODO(james): Make it constructive to have this as true.
    });
    var button_id = "delete_marker"+id;
    var infoContent = "<input id=" + button_id +
                      " type=\"button\" value=\"delete\"><br>" +
                      (notes == null ? "" : notes);
    var infoWindow = new google.maps.InfoWindow({
      content: infoContent,
      maxWidth: 200,
    });

    if (id == -1) {
      markerInc++;
      var content_id = "marker_content"+markerInc;
      var save_id = "marker_save"+markerInc;
      var createContent = "<input id=\"" + content_id +
                          "\" type=textbox><br><input id=" + save_id +
                          " type=\"button\" value=\"save\">";
      var createWindow = new google.maps.InfoWindow({
        content: createContent,
        maxWidth: 200,
      });
      createWindow.open(map, marker);
      document.getElementById(save_id).onclick = function() {
        notes = document.getElementById(content_id).value;
        console.log("Notes: " + notes);
        id = database_insert(parking_table, [ "lat", "lon", "notes" ], [
          [location.lat()],
          [location.lng()],
          [notes]
        ]);
        infoContent += notes;
        infoWindow.setContent(infoContent);
        console.log(id);
        createWindow.close();
      };
    }
    marker.addListener('click', function() {
      infoWindow.open(map, this);
      document.getElementById(button_id).addEventListener('click', function () {
        marker.setMap(null);
        if (id != -1) {
          database_remove(parking_table, id);
        }
      });
    });
  }

  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer({
    draggable: true,
    map: map,
    panel: document.getElementById('right-panel'),
    polylineOptions: {
      strokeOpacity: .3
    }
  });
  var control = document.getElementById('floating-panel');
  control.style.display = 'block';
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(control);

  document.getElementById('submit').addEventListener('click', function() {
    /*
    displayRoute(document.getElementById('start_address').value,
                 document.getElementById('end_address').value,
                 directionsService, directionsDisplay);
                 */
    var m1 = [new google.maps.Marker()];
    var m2 = [new google.maps.Marker()];
    geocodeAddress(geocoder, map, 'start_address', m1, m1, m2,
    directionsDisplay, directionsService);
    geocodeAddress(geocoder, map, 'end_address', m2, m1, m2, directionsDisplay,
    directionsService);
  });

  // Set up listener to change path elevation information if the user
  // clicks on another suggested route.
  google.maps.event.addListener(
      directionsDisplay,
      'routeindex_changed',
      updateRoutes
  );

  database_fetch(parking_table, [ "id", "lat", "lon", "notes" ], function() {
    if (this.readyState == 4 && this.status == 200) {
      // TODO(james): Cleanly handle no response text.
      var markers = JSON.parse(this.responseText);
      for (var i = 0; i < markers.length; i++) {
        var m = markers[i];
        var loc = new google.maps.LatLng(m[1], m[2]);
        placeMarker(loc, m[0], m[3]);
      }
    }
  });

  database_fetch(sharrows_table, ["id", "pindex", "lat", "lon"], function() {
    if (this.readyState == 4 && this.status == 200) {
      var points = JSON.parse(this.responseText);
      // Sort by id and index.
      points.sort(function(a, b){return (a[0] == b[0]) ? (a[1] - b[1])
                                                       : (a[0] - b[0])});
      if (points.length == 0) return;
      var cur_id = points[0][0];
      var coords = [];
      for (var i = 0; i < points.length; i++) {
        var row = points[i];
        var id = row[0];
        if (id != cur_id) {
          drawCoordinates(coords, id);
          cur_id = id;
          coords = [];
        } else {
          coords.push(new google.maps.LatLng(row[2], row[3]));
        }
      }
      // Otherwise, the last one doesn't get drawn...
      drawCoordinates(coords, cur_id);
    }
  });
}

function database_fetch(table, cols, callback) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = callback;
  xmlhttp.open("GET", "database.php?action=fetch&table=" + table + "&cols=" +
                          JSON.stringify(cols),
               true);
  xmlhttp.send();
}

function database_remove(table, id) {
  var deleter = new XMLHttpRequest();
  deleter.onreadystatechange = function() {};
  deleter.open("GET", "database.php?action=remove&table=" + table + "&id=" + id,
               true);
  deleter.send();
}

function database_insert(table, cols, vals) {
  if (cols.length != vals.length) {
    console.log("Warning: Have different length columns and values for database_insert");
  }
  var xmlhttp = new XMLHttpRequest();
  var id = -1;
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      id = parseInt(this.responseText);
    }
  };
  var get_str = "database.php?action=insert&table=" + table;
  for (var i = 0; i < cols.length; i++) {
    get_str += "&" + cols[i] + "=";
    get_str += JSON.stringify(vals[i]);
  }
  // TODO(james): Synchronous fetchs are bad; figure out how to avoid.
  xmlhttp.open("GET", get_str, false);
  xmlhttp.send();
  return id;
}

function geocodeAddress(geocoder, resultsMap, field_name, marker, m1, m2, disp, serv) {
  var address = document.getElementById(field_name).value;
  geocoder.geocode({'address': address, 'bounds': resultsMap.getBounds()}, function(results, status) {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      marker[0] = results[0].geometry.location
    } else {
      marker[0] = address;
    }
    if (geocoded === false) {
      geocoded = true;
    } else {
      displayRoute(m1[0], m2[0], serv, disp);
      geocoded = false;
    }
  });
}

function displayRoute(origin, destination, service, display) {
  service.route({
    origin: origin,
    destination: destination,
    provideRouteAlternatives: true,
    travelMode: 'BICYCLING',
  }, function(response, status) {
    if (status === 'OK') {
      display.setDirections(response);
    } else {
      alert('Could not display directions due to: ' + status);
    }
  });
}

function snapToRoad(path) {
  var pathValues = [];
  for (var i = 0; i < path.getLength(); i++) {
    pathValues.push(path.getAt(i).toUrlValue());
  }

  $.get('https://roads.googleapis.com/v1/snapToRoads', {
      interpolate: true,
      key: "AIzaSyBTOnifJS1nT2W3MVVZKn36DYMVfc_PQRw",
      path: pathValues.join('|')
      }, function(data) {
        var snappedCoordinates = processSnapToRoadResponse(data);
        drawCoordinates(snappedCoordinates, -1);
      });
}

// Store snapped polyline returned by the snap-to-road service.
function processSnapToRoadResponse(data) {
  var coords = [];
  for (var i = 0; i < data.snappedPoints.length; i++) {
    var latlng = new google.maps.LatLng(
        data.snappedPoints[i].location.latitude,
        data.snappedPoints[i].location.longitude);
    coords.push(latlng);
  }
  return coords
}

// Draws the snapped polyline (after processing snap-to-road response).
function drawCoordinates(coords, id) {
  var snappedPolyline = new google.maps.Polyline({
    path: coords,
    strokeColor: 'blue',
    strokeWeight: 3
  });

  snappedPolyline.setMap(map);

  if (id == -1) {
    // We need to add this line to the database.
    // Because id auto increments, first send in one row to get an id then add everything else.
    c0 = coords[0];
    id = database_insert(sharrows_table, ["pindex", "lat", "lon"], [[0], [c0.lat()], [c0.lng()]]);
    if (id != -1) {
      var vals = [[], [], [], []];
      for (var i = 1; i < coords.length; i++) {
        vals[0].push(id);
        vals[1].push(i);
        vals[2].push(coords[i].lat());
        vals[3].push(coords[i].lng());
      }
      database_insert(sharrows_table, ["id", "pindex", "lat", "lon"], vals);
    }
  }

  var button_id = "delete_line"+id;
  var infoContent =
      "<input id=" + button_id + " type=\"button\" value=\"delete\">";
  var infoWindow = new google.maps.InfoWindow({
    content: infoContent,
    maxWidth: 200,
  });
  var lineMarker = new google.maps.Marker({
    position: coords[0],
    map: map,
    visible: false,
  });
  snappedPolyline.addListener('click', function() {
    infoWindow.open(map, lineMarker);
    document.getElementById(button_id).addEventListener('click', function () {
      snappedPolyline.setMap(null);
      if (id != -1) {
        database_remove(sharrows_table, id);
      }
    });
  });
}
