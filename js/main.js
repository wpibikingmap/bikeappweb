var geocoded = false;
var parking_table ='locations';
var sharrows_table ='roads';
// For type ids for various things (which show up in the database tables), we
// use incrementing positive numbers for things that locations (eg, 1=parking,
// 2=shop, 3=intersection), positive incrementing for lines (eg, 1=lane,
// 2=sharrow, 3=dangerous) and 0 as a special/"none" value.
var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
var allMarkers = [];
var allRoads = [];
// TODO: Make it so that you only have to change things here to add/remove types.
var LocsEnum = {
  PARKING: 1,
  SHOP: 2,
  BAD_INTER: 3,
  icons: null,
  desc: { // Short descriptions of each thing.
    1: 'Bike Parking',
    2: 'Bike Shop',
    3: 'Dangerous Intersection',
  },
};
var RoadsEnum = {
  LANE: 1,
  SHARROW: 2,
  RISKY: 3,
  HIGHWAY: 4,
  FOO: 5,
  BAR: 6,
  colors: {
    1: 'green',
    2: 'blue',
    3: 'red',
    4: 'yellow',
    5: 'orange',
    6: 'purple',
  },
  desc: {
    1: 'Bike Lane',
    2: 'Sharrow',
    3: 'Risky Road',
    4: 'Highway',
    5: 'Foo',
    6: 'Bar',
  },
};
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    // Zoom on the city of worcester
    zoom: 13,
    center: {lat: 42.26, lng: -71.8},
    mapTypeId: 'terrain'
  });

  LocsEnum.icons = {
    0: null,
    1: {url: iconBase + 'parking_lot_maps.png', scaledSize: new google.maps.Size(25, 25)},
    2: {url: iconBase + 'capital_big_highlight.png', scaledSize: new google.maps.Size(20, 20)},
    3: {url: iconBase + 'caution.png', scaledSize: new google.maps.Size(30, 30)},
  };

  elevator = new google.maps.ElevationService();

  initAutoComplete('start_address');
  initAutoComplete('end_address');
  var geocoder = new google.maps.Geocoder();
  var trafficLayer = new google.maps.TrafficLayer();
  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(map);

  // Set up buttons for switching maps views
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
  if (document.getElementById('edit_mode') != null) {
    document.getElementById('edit_mode').addEventListener('change', function() {
      if (this.value == 'view') {
        if (placingListener) {
          placingListener.remove();
        }
        drawingManager.setMap(null);
      } else if (this.value == 'parking') {
        placingListener = google.maps.event.addListener(
            map, 'click', function(event) { placeMarker(event.latLng, -1, null, 0); });
        drawingManager.setMap(null);
      } else if (this.value == 'roads') {
        if (placingListener) {
          placingListener.remove();
        }
        drawingManager.setMap(map);
      }
    });
  }

  drawingManager.addListener('polylinecomplete', function(poly) {
    var path = poly.getPath();
    snapToRoad(path);
    poly.setMap(null);
  });

  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer({
    draggable: true,
    map: map,
    panel: document.getElementById('right-panel'),
    polylineOptions: {
      strokeOpacity: .3
    }
  });

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

  document.getElementById("open_maps").onclick = openMapsUrl;

  var control = document.getElementById('legend');
  populateLegend();
  /*
  control.style.display = 'block';
  */
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(control);

  database_fetch(parking_table, [ "id", "lat", "lon", "notes", "loc_type" ], function() {
    if (this.readyState == 4 && this.status == 200) {
      // TODO(james): Cleanly handle no response text.
      var markers = JSON.parse(this.responseText);
      for (var i = 0; i < markers.length; i++) {
        var m = markers[i];
        var loc = new google.maps.LatLng(m[1], m[2]);
        placeMarker(loc, m[0], m[3], m[4]);
      }
    }
  });

  database_fetch(sharrows_table, ["id", "pindex", "lat", "lon", "line_type"], function() {
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
          drawCoordinates(coords, cur_id, points[i-1][4]);
          cur_id = id;
          coords = [];
        } else {
          coords.push(new google.maps.LatLng(row[2], row[3]));
        }
      }
      // Otherwise, the last one doesn't get drawn...
      drawCoordinates(coords, cur_id, points[points.length-1][4]);
    }
  });
}

function populateLegend() {
  var legend = document.getElementById("legend_content");
  var content = "<h6>Lines</h6>";
  var roadchecks = []
  var locchecks = []
  for (var prop in RoadsEnum) {
    if (typeof(RoadsEnum[prop]) == "number") {
      var i = RoadsEnum[prop];
      content += "<label class=checkbox-inline>"+
                 "<input id=show_road"+i+" type=checkbox checked>"+
                 "<div class='color-box' style='background-color: "+
                 RoadsEnum.colors[i]+"'></div>"+RoadsEnum.desc[i]+"</label><br>";
      roadchecks.push("show_road"+i);
    }
  }
  content += "<h6>Markers</h6>";
  for (var prop in LocsEnum) {
    if (typeof(LocsEnum[prop]) == "number") {
      var i = LocsEnum[prop];
      content += "<label class=checkbox-inline>"+
                 "<input id=show_loc"+i+" type=checkbox checked>"+
                 "<img class='color-box' src='"+LocsEnum.icons[i].url+"'>"+
                 LocsEnum.desc[i]+"</label><br>";
      locchecks.push("show_loc"+i);
    }
  }
  legend.innerHTML += content;

  // Now, make the check boxes do something:
  for (var i in roadchecks) {
    var checkbox = document.getElementById(roadchecks[i]);
    checkbox.onclick = function() {
      var name = this.id;
      var type = name.substr(name.length - 1);
      var roads = $.grep(allRoads, function(e){ return e.type == type; });
      for (var j in roads) {
        var road = roads[j];
        console.log(road);
        road.road.setVisible(this.checked);
      }
    }
  }
  for (var i in locchecks) {
    var checkbox = document.getElementById(locchecks[i]);
    checkbox.onclick = function() {
      var name = this.id;
      var type = name.substr(name.length - 1);
      var locs = $.grep(allMarkers, function(e){ return e.type == type; });
      for (var j in locs) {
        var loc = locs[j];
        loc.marker.setVisible(this.checked);
      }
    }
  }
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
      $("#open_maps").removeClass("hide");
    } else {
      $("#open_maps").addClass("hide");
      alert('Could not display directions due to: ' + status);
    }
  });
}

var markerInc = 0;
function placeMarker(location, id, notes, type) {
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    icon: LocsEnum.icons[type],
    draggable: false // TODO(james): Make it constructive to have this as true.
  });
  var button_id = "delete_marker"+id;
  var infoButton = "<input id=" + button_id +
                    " type=\"button\" value=\"delete\"><br>";
  var infoContent = (notes == null ? "" : notes);
  var infoWindow = new google.maps.InfoWindow({
    content: infoContent,
    maxWidth: 200,
  });

  if (id == -1) {
    markerInc++;
    var content_id = "marker_content"+markerInc;
    var save_id = "marker_save"+markerInc;
    var type_id = "line_type"+markerInc;
    var createContent = "<input id=\"" + content_id +
                        "\" type=textbox><br><input id=" + save_id +
                        " type=\"button\" value=\"save\">"+
                        "<select id=\"" + type_id + "\">";
    for (var prop in LocsEnum) {
      if (typeof(LocsEnum[prop]) == "number") {
        createContent += "<option value='" + prop + "'>" +
                         LocsEnum.desc[LocsEnum[prop]] + "</option>";
      }
    }
    createContent += "</select>";
    var createWindow = new google.maps.InfoWindow({
      content: createContent,
      maxWidth: 200,
    });
    createWindow.open(map, marker);
    createWindow.addListener('closeclick', function() {
      if (id == -1) {
        marker.setVisible(false);
      }
    });
    document.getElementById(save_id).onclick = function() {
      type = LocsEnum[document.getElementById(type_id).value];
      marker.setIcon(LocsEnum.icons[type]);
      notes = document.getElementById(content_id).value;
      id = database_insert(parking_table, [ "lat", "lon", "notes", "loc_type" ], [
        [location.lat()],
        [location.lng()],
        [notes],
        [type]
      ]);
      infoContent += notes;
      infoWindow.setContent(infoButton+infoContent);
      createWindow.close();
      allMarkers.push({
        marker: marker,
        id: id,
        type: type,
      });
    };
  } else {
    allMarkers.push({
      marker: marker,
      id: id,
      type: type,
    });
  }

  marker.addListener('click', function() {
    var viewing = true;
    if (document.getElementById('edit_mode') != null) {
      viewing = document.getElementById('edit_mode').value == 'view';
    }
    if (viewing) {
      infoWindow.setContent(infoContent);
      infoWindow.open(map, this);
    } else {
      infoWindow.setContent(infoButton+infoContent);
      infoWindow.open(map, this);
      document.getElementById(button_id).addEventListener('click', function () {
        marker.setMap(null);
        if (id != -1) {
          database_remove(parking_table, id);
        }
      });
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
        drawCoordinates(snappedCoordinates, -1, -1);
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
var lineInc = 0;
function drawCoordinates(coords, id, type) {
  var snappedPolyline = new google.maps.Polyline({
    path: coords,
    strokeColor: RoadsEnum.colors[type],
    strokeWeight: 3
  });

  var lineMarker = new google.maps.Marker({
    position: coords[0],
    map: map,
    visible: false,
  });

  snappedPolyline.setMap(map);

  if (id == -1) {
    lineInc++;

    var content_id = "line_content"+lineInc;
    var save_id = "line_save"+lineInc;
    var type_id = "line_type"+lineInc;
    var createContent = "<input id=" + save_id +
                        " type=\"button\" value=\"save\">"+
                        "<select id=\"" + type_id + "\">";
    for (var prop in RoadsEnum) {
      if (typeof(RoadsEnum[prop]) == "number") {
        createContent += "<option value='" + prop + "'>" +
                         RoadsEnum.desc[RoadsEnum[prop]] + "</option>";
      }
    }
    createContent += "</select>";
    var createWindow = new google.maps.InfoWindow({
      content: createContent,
      maxWidth: 200,
    });
    createWindow.open(map, lineMarker);
    document.getElementById(save_id).onclick = function() {
      var type = RoadsEnum[document.getElementById(type_id).value];
      snappedPolyline.setOptions({strokeColor: RoadsEnum.colors[type]});
      // We need to add this line to the database.
      // Because id auto increments, first send in one row to get an id then add everything else.
      c0 = coords[0];
      id = database_insert(sharrows_table, ["pindex", "lat", "lon", "line_type"], [[0], [c0.lat()],
                                           [c0.lng()], [type]]);
      if (id != -1) {
        var vals = [[], [], [], [], []];
        for (var i = 1; i < coords.length; i++) {
          vals[0].push(id);
          vals[1].push(i);
          vals[2].push(coords[i].lat());
          vals[3].push(coords[i].lng());
          vals[4].push(type);
        }
        database_insert(sharrows_table, ["id", "pindex", "lat", "lon", "line_type"], vals);
        createWindow.close();

        allRoads.push({
          road: snappedPolyline,
          id: id,
          type: type,
        });
      }
    }
  } else {
    allRoads.push({
      road: snappedPolyline,
      id: id,
      type: type,
    });
  }

  snappedPolyline.addListener('click', function() {
    var button_id = "delete_line"+id;
    var infoContent =
        "<input id=" + button_id + " type=\"button\" value=\"delete\">";
    var infoWindow = new google.maps.InfoWindow({
      content: infoContent,
      maxWidth: 200,
    });

    if (document.getElementById('edit_mode') != null &&
        document.getElementById('edit_mode').value != 'view') {
      infoWindow.open(map, lineMarker);
      document.getElementById(button_id).addEventListener('click', function () {
        infoWindow.close();
        snappedPolyline.setMap(null);
        if (id != -1) {
          database_remove(sharrows_table, id);
        }
      });
    }
  });
}

function openMapsUrl() {
  // Encodes the current directions as a google maps url and sends it out.
  var url = "https://www.google.com/maps/dir/";
  legs = directionsDisplay.getDirections().routes[directionsDisplay.getRouteIndex()].legs;
  url += legs[0].start_location.toString() + "/";

  for (var i in legs) {
    leg = legs[i];
    waypoints = leg.via_waypoints;
    for (var j in waypoints) {
      // Will append the lat/lon of each waypoint.
      url += waypoints[j].toString() + "/";
    }
    url += leg.end_location.toString() + "/";
  }

  url += "data=!4m2!4m1!3e1"; // Magic numbers to show bicycling directions

  window.open(url, "_blank");
}
