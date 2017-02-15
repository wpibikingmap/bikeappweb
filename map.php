<!DOCTYPE html>
<html>
  <head>
    <title>Bicyling Map</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">
    <link rel="stylesheet" type="text/css" href="css/main.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <div class="row">
            <input id="start_address" type="textbox" placeholder="From Address">
          </div>
          <div class="row">
            <input id="end_address" type="textbox" placeholder="To Address">
          </div>
          <div class="row">
            <div class="col-md-9">
              <input id="submit" type="button" value="Directions" class="btn btn-primary">
              <button id="show_help" type="button" class="btn btn-primary" data-toggle="collapse"
                      data-target="#about-help">Help</button>
              <input id="open_maps" type="button" value="Open Directions in Google Maps" class="btn btn-primary hide">
<?php
require_once './includes/common.inc';
retrieve_session();
if (is_valid_user()) {
  print('
            </div>
            <div class="col-md-3">
');
} else {
  print('
              <input id="add_data" type="button" value="Add Information To Map" class="btn btn-primary">
            </div>
            <div class="col-md-3">
');
}
?>
              <select class="form-control hide" id="edit_mode">
                <option value="view">View</option>
                <option value="parking">Edit Markers</option>
                <option value="roads">Edit Lines</option>
              </select>
            </div>
          </div>
        </div>
        <div class="col-md-3" id="elevation_chart"></div>
        <div class="col-md-3" id="slope_chart"></div>
      </div>
      <div class="row collapse" id="about-help">
        Hide this text by clicking "Help".
        <ul>
          <li>The directions finding for this map is purely based on Google Maps&mdash;when
              you get directions here they are the same as what you would get on Google Maps
          </li>
          <li>The main goal of this map is to add some additional features to make it easier
              for you to make decisions about what routes to take and where to bike
              <ul>
                <li>It shows you the locations of various dangerous spots, bike parking, etc.</li>
                <li>It provides some visualization so you can see what hills there are along
                    your route</li>
              </ul>
          </li>
          <li>Anyone can add data to the map by clicking "Add Information To Map".
          </li>
        </ul>
        <div id="add-data-help" class="hide">
          <p>
          In order to add data, change the selection from "view" to one of the editing
          modes. You can then create new markers and lines (you can not edit existing ones).
          The new markers/lines will show up with a red "N"; when an administrator has a
          chance to take a look, they will approve any new changes. Any unapproved additions
          made by you or anyone else will also show up with a red "N" and can be editted,
          unlike the permanent ones.
          </p>
          <p>
          The different types of line and markers that you can add are:
          <ul>
            <li>Bike Lane: Any sort of traditional bike lane</li>
            <li>Sharrow: Markings on the road for bikes, but no separate bike lane</li>
            <li>Risky Road: A road that is particularly risky (high speed, lots of cars merging in/out of traffic, etc.</li>
            <li>Recreational Ride: Suggestions for relatively good places to ride</li>
            <li>Bike Lane Suggestions: These do not show up when a typical user views the map;
                they are any place where any user thinks that there should be a bike lane.
                We will try to put all the suggestions together periodically and show them
                to various planning departments
            </li>
            <li>Bike Parking: Places where you can easily park your bike. Try to include some sort
                of comment specifying what sort of rack it is, whether it is protected from
                the weather, etc.</li>
            <li>Dangerous Intersection: Intersections which are particularly dubious to bike through</li>
            <li>Bike Shop: Anything that could reasonably be classified as a bike shop (can include any sort of biking organization).</li>
            <li>Information: Any sort of general information that may be useful</li>
          </ul>
          </p>

          <p>See <a href="https://github.com/wpibikingmap/bikeappweb/blob/master/README.md" target="_blank">here</a> for some more documentation and the source code for this project.</p>
        </div>
      </div>
      <div class="row">
         <div class="col-md-9" id="map"></div>
         <div class="col-md-3 hide" id="right-panel"></div>
      </div>
        </div>
    </div>

    <div id="legend">
      <div align="right">
      <button class="btn btn-xs" data-toggle="collapse" data-target="#legend_content">Legend</button>
      </div>
      <div id="legend_content" class="collapse in">
          <h6>Google Data Layers</h6>
          <select id="google_layer">
            <option value="traffic"> Traffic Layer</option>
            <option value="biking"> Biking Layer</option>
            <option value="none"> Neither</option>
          </select> <br>
          <label class="checkbox-inline">
            <input id="terrain_check" type="checkbox" checked> Show Elevation Lines
          </label>
          <div id="directions_controls" class="hide">
            <h6>Directions</h6>
            <label class="checkbox-inline">
              <input id="downhill_check" type="checkbox"> Show Downhill Slopes
            </label><br><br>
          </div>
      </div>
    </div>

    <script src="https://code.jquery.com/jquery-1.9.1.min.js"></script>
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>

    <script type="text/javascript" src="js/flattest-route.js"></script>
    <script type="text/javascript" src="js/main.js"></script>
    <script async defer
         src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBTOnifJS1nT2W3MVVZKn36DYMVfc_PQRw&callback=initMap&libraries=places,drawing">
    </script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>
  </body>
</html>
