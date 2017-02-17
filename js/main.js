// Welcome to a bunch o' spaghetti. Have fun.
// See https://docs.google.com/document/d/1RnK6cNr9uUIWaiiOsIdOzKCjXmKY834luh3LB9z2GOs/edit#
var geocoded = false;
var parking_table ='locations';
var sharrows_table ='roads';
var vote_table ='votes';
var slocs_table ='suggested_locations';
var sroads_table ='suggested_roads';
// For type ids for various things (which show up in the database tables), we
// use incrementing positive numbers for things that locations (eg, 1=parking,
// 2=shop, 3=intersection), positive incrementing for lines (eg, 1=lane,
// 2=sharrow, 3=dangerous) and 0 as a special/"none" value.
var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
var suggestedLabel = {
  fontFamily : "arial",
  color : "red",
  fontSize : "20px",
  fontWeight : "900",
  text : "N"
};
var allMarkers = [];
var allRoads = [];
var allVotes = {}; // Each element is indexed at id, contains {up:, down:}.
var isValidUser = false;
var pathColors = {
  5 : "#3CB371",
  10 : "#FFFF00",
  15 : "#FF9800",
  20 : "#F44336",
  Infinity : "#000000"
};
// TODO: Make it so that you only have to change things here to add/remove types.
var LocsEnum = {
  PARKING: 1,
  SHOP: 2,
  BAD_INTER: 3,
  INFO: 4,
  icons: null,
  desc: { // Short descriptions of each thing.
    1: 'Bike Parking',
    2: 'Bike Shop',
    3: 'Dangerous Intersection',
    4: 'General Information',
  },
  show: {
    1: true,
    2: true,
    3: true,
    4: true,
  }
};
var ReverseLocsEnum = {};
var ReverseRoadsEnum = {};
var RoadsEnum = {
  LANE: 1,
  SHARROW: 2,
  RISKY: 3,
//  HIGHWAY: 4,
  FOO: 5,
  BAR: 6,
  colors: {
    1: '#5FF92E', // light green
    2: 'blue',
    3: '#FE32CA', // pink/purple
//    4: 'red',
    5: 'orange',
    6: 'yellow',
  },
  desc: {
    1: 'Bike Lane',
    2: 'Sharrow<br>(ie, bike markings on roads)',
    3: 'Risky Road',
//    4: 'Highway',
    5: 'Recreational Ride',
    6: 'Bike lane suggestions',
  },
  show: {
    1: true,
    2: true,
    3: true,
 //   4: false,
    5: true,
    6: true,
  },
  showInViewMode: {
    // Whether or not to display while in "view" mode.
    1: true,
    2: true,
    3: true,
    5: true,
    6: false,
  }
};
function initMap() {
  LocsEnum.icons = {
    0 : null,
    1 : {
      url : iconBase + 'parking_lot_maps.png',
      anchor : new google.maps.Point(13, 13),
      scaledSize : new google.maps.Size(25, 25),
      labelOrigin : new google.maps.Point(5, 5),
    },
    2 : {
      url : iconBase + 'capital_big_highlight.png',
      anchor : new google.maps.Point(10, 10),
      scaledSize : new google.maps.Size(20, 20),
      labelOrigin : new google.maps.Point(5, 5),
    },
    3 : {
      url : iconBase + 'caution.png',
      anchor : new google.maps.Point(15, 15),
      scaledSize : new google.maps.Size(30, 30),
      labelOrigin : new google.maps.Point(5, 5),
    },
    4 : {
      url : iconBase + 'info.png',
      anchor : new google.maps.Point(15, 15),
      scaledSize : new google.maps.Size(30, 30),
      labelOrigin : new google.maps.Point(5, 5),
    },
  };
  for (var prop in LocsEnum) {
    if (typeof(LocsEnum[prop]) == "number") {
      ReverseLocsEnum[LocsEnum[prop]] = prop;
    }
  }
  for (var prop in RoadsEnum) {
    if (typeof(RoadsEnum[prop]) == "number") {
      ReverseRoadsEnum[RoadsEnum[prop]] = prop;
    }
  }

  if (document.getElementById("add_data") === null) {
    $("#edit_mode").removeClass("hide");
    isValidUser = true;
  }

  map = new google.maps.Map(document.getElementById('map'), {
    // Zoom on the city of worcester
    zoom: 13,
    center: {lat: 42.26, lng: -71.8},
    mapTypeId: 'terrain'
  });

  elevator = new google.maps.ElevationService();

  initAutoComplete('start_address');
  initAutoComplete('end_address');
  var geocoder = new google.maps.Geocoder();

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

  if (!isValidUser) {
    document.getElementById("add_data").onclick = function() {
      $("#add_data").addClass("hide");
      $("#edit_mode").removeClass("hide");
      $("#add-data-help").removeClass("hide");
      $("#about-help").collapse();
    };
  }

  var placingListener;
  if (document.getElementById('edit_mode') != null) {
    document.getElementById('edit_mode').addEventListener('change', function() {
      setMarkerVisibilities();
      setRoadVisibilities();
      if (this.value == 'view') {
        if (placingListener) {
          placingListener.remove();
        }
        drawingManager.setMap(null);
      } else if (this.value == 'parking') {
        // Remove drawer and allow markers to be placed.
        placingListener =
            google.maps.event.addListener(map, 'click', function(event) {
              placeMarker(event.latLng, -1, null, 0,
                          isValidUser ? parking_table : slocs_table);
            });
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

  database_fetch(vote_table, [ "id", "upvotes", "downvotes" ], function() {
    if (this.readyState == 4 && this.status == 200) {
      var raw = JSON.parse(this.responseText);
      for (var i = 0; i < raw.length; i++) {
        allVotes[raw[i][0]] = {up : raw[i][1], down : raw[i][2]};
      }
    }
  });

  database_fetch(parking_table, [ "id", "lat", "lon", "notes", "loc_type" ], function() {
    if (this.readyState == 4 && this.status == 200) {
      // TODO(james): Cleanly handle no response text.
      var markers = JSON.parse(this.responseText);
      for (var i = 0; i < markers.length; i++) {
        var m = markers[i];
        var loc = new google.maps.LatLng(m[1], m[2]);
        placeMarker(loc, m[0], m[3], m[4], parking_table);
      }
      setMarkerVisibilities();
    }
  });

  database_fetch(slocs_table, [ "id", "lat", "lon", "notes", "loc_type" ], function() {
    if (this.readyState == 4 && this.status == 200) {
      // TODO(james): Cleanly handle no response text.
      var markers = JSON.parse(this.responseText);
      for (var i = 0; i < markers.length; i++) {
        var m = markers[i];
        var loc = new google.maps.LatLng(m[1], m[2]);
        placeMarker(loc, m[0], m[3], m[4], slocs_table);
      }
      setMarkerVisibilities();
    }
  });
  fetchRoads(sharrows_table, true);
  fetchRoads(sroads_table, false);

  var control = document.getElementById('legend');
  populateLegend();
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(control);
}

function fetchRoads(table, visible) {
  database_fetch(table, ["id", "pindex", "lat", "lon", "line_type", "notes"], function() {
    if (this.readyState == 4 && this.status == 200) {
      var points = JSON.parse(this.responseText);
      // Sort by id and index.
      points.sort(function(a, b){return (a[0] == b[0]) ? (a[1] - b[1])
                                                       : (a[0] - b[0])});
      if (points.length == 0) return;
      var cur_id = points[0][0];
      var notes = "";
      var coords = [];
      for (var i = 0; i < points.length; i++) {
        var row = points[i];
        var id = row[0];
        if (id != cur_id) {
          var road = drawCoordinates(coords, cur_id, points[i-1][4], table, notes);
          cur_id = id;
          coords = [];
          notes = "";
        }
        coords.push(new google.maps.LatLng(row[2], row[3]));
        notes += row[5];
      }
      // Otherwise, the last one doesn't get drawn...
      var road = drawCoordinates(coords, cur_id, points[points.length - 1][4], table);
      setRoadVisibilities();
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
      content += "<label class=\"checkbox-inline "+ (RoadsEnum.showInViewMode[i] ? "" : "hide") + "\">" +
                 "<input id=show_road"+i+" type=checkbox "+ (RoadsEnum.show[i] ? "checked" : "") +">"+
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

  // Add slopes for directions
  var dirContent = "";
  var previ = 0;
  for (var i in pathColors) {
    var itext = (i == Infinity) ? previ + "% grade and up"
                                : previ + "% to " + i + "% grade";
    dirContent += "<div class='color-box' style='background-color: " +
                  pathColors[i] + "'></div>" + itext + "<br>";
    previ = i;
  }
  document.getElementById("directions_controls").innerHTML += dirContent;

  // Now, make the check boxes do something:
  for (var i in roadchecks) {
    var checkbox = document.getElementById(roadchecks[i]);
    checkbox.onclick = function() {
      var name = this.id;
      // TODO: Support multi-digit types
      var type = name.substr(name.length - 1);
      RoadsEnum.show[type] = this.checked;
      setRoadVisibilities();
    }
  }
  for (var i in locchecks) {
    var checkbox = document.getElementById(locchecks[i]);
    checkbox.onclick = function() {
      var name = this.id;
      // TODO: Support multi-digit types
      var type = name.substr(name.length - 1);
      LocsEnum.show[type] = this.checked;
      setMarkerVisibilities();
    }
  }

  var trafficLayer = new google.maps.TrafficLayer();
  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(map);
  document.getElementById('google_layer').value = "biking";
  // Set up buttons for switching maps views
  document.getElementById('google_layer').addEventListener('change', function () {
    if (this.value == "traffic") {
      trafficLayer.setMap(map);
      bikeLayer.setMap(null);
    } else if (this.value == "biking") {
      trafficLayer.setMap(null);
      bikeLayer.setMap(map);
    } else {
      trafficLayer.setMap(null);
      bikeLayer.setMap(null);
    }
  });
  document.getElementById('terrain_check').onclick = function() {
    map.setMapTypeId(document.getElementById('terrain_check').checked ? 'terrain' : 'roadmap');
  }
  document.getElementById('downhill_check').onclick = updateRoutes;
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

function database_update(table, where_cond, vals) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {};
  var get_str = "database.php?action=update&table=" + table + "&where=" + where_cond;
  for (var i in vals) {
    get_str += "&" + i + "=" + String(vals[i]).replace(/\+/g, "%2B");
  }
  xmlhttp.open("GET", get_str, true);
  xmlhttp.send();
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
  $("#right-panel").removeClass("hide");
  service.route({
    origin: origin,
    destination: destination,
    provideRouteAlternatives: true,
    travelMode: 'BICYCLING',
  }, function(response, status) {
    if (status === 'OK') {
      display.setDirections(response);
      $("#open_maps").removeClass("hide");
      $("#directions_controls").removeClass("hide");
    } else {
      $("#open_maps").addClass("hide");
      alert('Could not display directions due to: ' + status);
    }
  });
}

// The number id; boolean true if upvote, false if down; update_element is the element id to write the new vote to
function handleUserVote(id, is_up, update_element) {
  var button_id = (is_up ? "upvote" : "downvote") + id;
  if ($("#" + button_id).hasClass("disabled")) {
    return;
  }
  var cur_vote = parseInt($("#"+update_element).html());
  database_update(vote_table, "id = " + id, is_up ? {upvotes: "upvotes + 1"} : {downvotes: "downvotes + 1"});
  cur_vote += 1;
  $("#" + update_element).html(String(cur_vote));
  if (is_up) {
    allVotes[id].up = cur_vote;
  } else {
    allVotes[id].down = cur_vote;
  }
  // Force them to reopen the dialog
  $("#" + button_id).addClass("disabled");
}

// Constructs the HTML for being able to vote
// viewing = true or false, depending on whether the user can vote
function constructVotingHTML(id, viewing) {
  var up_button_id = "upvote" + id;
  var down_button_id = "downvote" + id;
  var up_cnt_id = "upcount" + id;
  var down_cnt_id = "downcount" + id;
  var up_btn_html = "<button class=\"btn btn-success btn-xs\" id=\"" + up_button_id + "\" onclick=\"" +
                    "handleUserVote(" + id + ", " + true + ", \'" + up_cnt_id + "\')\">Up-Vote</button>";
  var down_btn_html = "<button class=\"btn btn-danger btn-xs\" id=\"" + down_button_id + "\" onclick=\"" +
                    "handleUserVote(" + id + ", " + false + ", \'" + down_cnt_id + "\')\">Down-Vote</button>";
  var up_cnt_html = "<span id=\"" + up_cnt_id + "\">" + allVotes[id].up + "</span>";
  var down_cnt_html = "<span id=\"" + down_cnt_id + "\">" + allVotes[id].down + "</span>";
  var view_html = "Up-Votes: " + up_cnt_html + " Down-Votes: " + down_cnt_html;
  var edit_html = up_btn_html + " " + up_cnt_html + " " + down_btn_html + " " + down_cnt_html;
  var html = viewing ? view_html : edit_html;
  return html;
}

var markerInc = 0;
function placeMarker(location, id, notes, type, table) {
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    icon: LocsEnum.icons[type],
    draggable: id == -1,
  });
  if (table == slocs_table) {
    marker.setLabel(suggestedLabel);
  }
  var button_id = "delete_marker"+markerInc;
  var deleteButton = "<input id=" + button_id +
                    " type=\"button\" value=\"delete\">";
  var promote_id = "promote_marker"+markerInc;
  var promoteButton = "<input id=" + promote_id +
                    " type=\"button\" value=\"publish\">";
  var info_id = "info_content"+markerInc;
  var infoContent = "<span id='"+info_id+"'></span>"+(notes == null ? "" : notes);
  var infoWindow = new google.maps.InfoWindow({
    content: infoContent,
    maxWidth: 200,
  });

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
  var marker_data = {marker : marker, id : id, type : type, table : table};
  var save_fun = function() {
    type = LocsEnum[document.getElementById(type_id).value];
    marker.setIcon(LocsEnum.icons[type]);
    notes = document.getElementById(content_id).value;
    if (id != -1) {
      for (var i in allMarkers) {
        if (allMarkers[i].marker === marker) {
          allMarkers.splice(i, 1);
        }
      }
      database_remove(table, id);
    }
    id = database_insert(vote_table, [], []);
    allVotes[id] = {up: 0, down: 0};
    database_insert(table, [ "id", "lat", "lon", "notes", "loc_type" ], [
      [id],
      [location.lat()],
      [location.lng()],
      [notes],
      [type]
    ]);
    infoContent += notes;
    infoWindow.setContent(deleteButton+infoContent);
    createWindow.close();
    marker_data.id = id;
    marker_data.type = type;
    allMarkers.push(marker_data);
  };
  if (id == -1) {
    createWindow.open(map, marker);
    createWindow.addListener('closeclick', function() {
      if (id == -1) {
        marker.setVisible(false);
      }
    });
    document.getElementById(save_id).onclick = save_fun;
  } else {
    marker_data.id = id;
    marker_data.type = type;
    allMarkers.push(marker_data);
  }

  marker.addListener('click', function() {
    if (id == -1) {
      // It is still being created, do nothing.
      return;
    }
    var viewing = true;
    if (document.getElementById('edit_mode') != null) {
      viewing = document.getElementById('edit_mode').value == 'view';
    }
    if (!viewing) {
      viewing = isValidUser ? false : (table == slocs_table ? false : true);
    }
    var can_promote = isValidUser && table == slocs_table;
    if (viewing) {
      if (document.getElementById(info_id) != null) {
        // The info box is open, close it.
        // Don't close it if it is the create window, as
        // they may still be editting.
        infoWindow.close();
        return;
      } else {
        infoWindow.setContent(infoContent);
        infoWindow.open(map, this);
      }
    } else {
      infoWindow.close();
      createWindow.setContent(createContent + deleteButton +
                              (can_promote ? promoteButton : "") + "<br>" +
                              constructVotingHTML(id, false));
      createWindow.open(map, this);
      document.getElementById(content_id).value = notes;
      document.getElementById(type_id).value = ReverseLocsEnum[type];
      document.getElementById(save_id).onclick = save_fun;
      document.getElementById(button_id).addEventListener('click', function () {
        marker.setMap(null);
        if (id != -1) {
          database_remove(table, id);
          database_remove(vote_table, id);
        }
      });
      if (can_promote) {
        document.getElementById(promote_id).addEventListener('click', function () {
          database_remove(table, id);
          database_insert(parking_table,
                               [ "id", "lat", "lon", "notes", "loc_type" ], [
            [id],
            [marker.getPosition().lat()],
            [marker.getPosition().lng()],
            [notes],
            [type]
          ]);
          var markerData = $.grep(allMarkers, function(e){ return e.marker === marker; })[0];
          markerData.id = id;
          markerData.table = parking_table;
          table = parking_table;
          markerData.marker.setLabel(null);
        });
      }
    }
  });

  marker.addListener('dragend', function() {
    if (id != -1) {
      database_remove(table, id);
      database_insert(table, ["id", "lat", "lon", "notes", "loc_type"], [
          [id],
          [this.getPosition().lat()],
          [this.getPosition().lng()],
          [notes],
          [type]]);
    }
  });

  return marker_data;
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
        drawCoordinates(snappedCoordinates, -1, -1,
                        isValidUser ? sharrows_table : sroads_table, "");
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
function drawCoordinates(coords, id, type, table, notes) {
  if (id != -1 && RoadsEnum.colors[type] == null) {
    return null;
  }
  var snappedPolyline = new google.maps.Polyline({
    path: coords,
    strokeColor: RoadsEnum.colors[type],
    strokeWeight: 3
  });

  var lineMarker = new google.maps.Marker({
    position: coords[0],
    map: map,
    icon: {url: "empty.png", size: {width: 30, height: 30}},
    label: table == sroads_table ? suggestedLabel : null,
    visible: true,
  });

  snappedPolyline.setMap(map);

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
  var save_fun = function() {
    var type = RoadsEnum[document.getElementById(type_id).value];
    snappedPolyline.setOptions({strokeColor: RoadsEnum.colors[type]});
    // Remove it if we are editting
    if (id != -1) {
      for (var i in allRoads) {
        if (allRoads[i].road === snappedPolyline) {
          allRoads.splice(i, 1);
        }
      }
      database_remove(table, id);
    }
    var vertices = snappedPolyline.getPath();
    id = database_insert(vote_table, [], []);
    allVotes[id] = {up: 0, down: 0};
    if (id != -1) {
      var vals = [[], [], [], [], []];
      for (var i = 0; i < vertices.getLength(); i++) {
        vals[0].push(id);
        vals[1].push(i);
        vals[2].push(vertices.getAt(i).lat());
        vals[3].push(vertices.getAt(i).lng());
        vals[4].push(type);
      }
      database_insert(table, [ "id", "pindex", "lat", "lon", "line_type" ],
                      vals);
      createWindow.close();

      allRoads.push({
        road: snappedPolyline,
        id: id,
        type: type,
        table: table,
        marker: lineMarker,
        notes: notes,
      });
    }
    setRoadVisibilities();
  }
  if (id == -1) {
    createWindow.addListener('closeclick', function() {
      if (id == -1) {
        snappedPolyline.setVisible(false);
        lineMarker.setVisible(false);
      }
    });
    createWindow.open(map, lineMarker);
    document.getElementById(save_id).onclick = save_fun;
  } else {
    allRoads.push({
      road: snappedPolyline,
      id: id,
      type: type,
      table: table,
      marker: lineMarker,
      notes: notes,
    });
  }

  var infoWindow = new google.maps.InfoWindow({
    maxWidth: 200,
    disableAutoPan: true,
  });
  var click_fun = function() {
    var button_id = "delete_line"+id;
    var infoContent = createContent +
        "<input id=" + button_id + " type=\"button\" value=\"delete\">";
    var promote_id = "promote_marker"+id;
    var promoteButton = "<input id=" + promote_id +
                      " type=\"button\" value=\"publish\">";

    var viewing = true;
    if (document.getElementById('edit_mode') != null) {
      viewing = document.getElementById('edit_mode').value == 'view';
    }
    if (!viewing) {
      viewing = isValidUser ? false : (table == sroads_table ? false : true);
    }
    var can_promote = isValidUser && table == sroads_table;
    if (!viewing) {
      var voteContent = "<br>" + constructVotingHTML(id, false);
      if (can_promote) {
        infoWindow.setContent(infoContent + promoteButton + voteContent);
      } else {
        infoWindow.setContent(infoContent + voteContent);
      }
      infoWindow.open(map, lineMarker);
      document.getElementById(button_id).addEventListener('click', function () {
        infoWindow.close();
        snappedPolyline.setMap(null);
        lineMarker.setMap(null);
        if (id != -1) {
          database_remove(table, id);
          database_remove(vote_table, id);
        }
      });

      document.getElementById(save_id).onclick = save_fun;
      document.getElementById(type_id).value = ReverseRoadsEnum[type];

      if (can_promote) {
        document.getElementById(promote_id).addEventListener('click', function () {
          if (id != -1) {
            database_remove(table, id);
            table = sharrows_table;
            var vals = [[], [], [], [], []];
            for (var i = 0; i < coords.length; i++) {
              vals[0].push(id);
              vals[1].push(i);
              vals[2].push(coords[i].lat());
              vals[3].push(coords[i].lng());
              vals[4].push(type);
            }
            database_insert(table, [ "id", "pindex", "lat", "lon", "line_type" ],
                            vals);
            table = sharrows_table;
            var roadData =
                $.grep(allRoads,
                       function(e) { return e.road === snappedPolyline; })[0];
            roadData.id = id;
            roadData.table = sharrows_table;
            roadData.marker.setLabel(null);
            setRoadVisibilities();
          }
        });
      }
    }
  };

  snappedPolyline.addListener('click', click_fun);
  snappedPolyline.addListener('mouseup', click_fun);

  return snappedPolyline;
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

function isEditMarkersMode() {
  return document.getElementById("edit_mode").value == "parking";
}

function isEditRoadsMode() {
  return document.getElementById("edit_mode").value == "roads";
}

function shouldShowMarker(marker) {
  return LocsEnum.show[marker.type] &&
         (isEditMarkersMode() || marker.table != slocs_table);
}

function shouldDragMarker(marker) {
  return isEditMarkersMode() && (isValidUser || marker.table == slocs_table);
}

function shouldShowRoad(road) {
  return RoadsEnum.show[road.type] &&
         (isEditRoadsMode() || (RoadsEnum.showInViewMode[road.type] && road.table != sroads_table));
}

function shouldDragRoad(road) {
  return isEditRoadsMode() && (isValidUser || road.table == sroads_table);
}

function setMarkerVisibilities() {
  for (var i in allMarkers) {
    var mark = allMarkers[i];
    mark.marker.setDraggable(shouldDragMarker(mark));
    mark.marker.setVisible(shouldShowMarker(mark));
  }
}

function setRoadVisibilities() {
  for (var i in allRoads) {
    var road = allRoads[i];
    road.road.setVisible(shouldShowRoad(road));
    road.road.setEditable(shouldDragRoad(road));
    road.marker.setVisible(road.road.getVisible());
  }
}
