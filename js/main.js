var geocoded = false;
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

  google.maps.event.addListener(map, 'click', function(event) {
    placeMarker(event.latLng, -1);
  });

  function placeMarker(location, id) {
    console.log(location);
    var xmlhttp = new XMLHttpRequest();
    if (id == -1) {
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          id = this.responseText;
        }
      };
      xmlhttp.open("GET", "database.php?action=insert&lat=" + location.lat() +
                          "&lon=" + location.lng(), true);
      xmlhttp.send();
    }
    var marker = new google.maps.Marker({
      position: location,
      map: map,
      icon: icons['parking'].icon,
      draggable: true
    });
    marker.addListener('click', function() {
      this.setMap(null);
      if (id != -1) {
        var deleter = new XMLHttpRequest();
        deleter.onreadystatechange = function() {};
        deleter.open("GET", "database.php?action=remove&id=" + id, true);
        deleter.send();
      }
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
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);


  document.getElementById('submit').addEventListener('click', function() {
    var m1 = new google.maps.Marker();
    var m2 = new google.maps.Marker();
    geocodeAddress(geocoder, map, 'start_address', m1, m1, m2, directionsDisplay, directionsService);
    geocodeAddress(geocoder, map, 'end_address', m2, m1, m2, directionsDisplay, directionsService);
  });

  // Set up listener to change path elevation information if the user
  // clicks on another suggested route.
  google.maps.event.addListener(
      directionsDisplay,
      'routeindex_changed',
      updateRoutes
  );

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var markers = JSON.parse(this.responseText);
      for (var i = 0; i < markers.length; i++) {
        var m = markers[i];
        var loc = new google.maps.LatLng(m[1], m[2]);
        placeMarker(loc, m[0]);
      }
    }
  };
  xmlhttp.open("GET", "database.php?action=fetch", true);
  xmlhttp.send();
}

function geocodeAddress(geocoder, resultsMap, field_name, marker, m1, m2, disp, serv) {
  var address = document.getElementById(field_name).value;
  geocoder.geocode({'address': address, 'bounds': resultsMap.getBounds()}, function(results, status) {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      marker.setPosition(results[0].geometry.location);
      console.log(marker.getPosition());
      if (geocoded === false) {
        geocoded = true;
      } else {
        displayRoute(m1.getPosition(), m2.getPosition(), serv, disp);
        geocoded = false;
      }
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
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
