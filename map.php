<!DOCTYPE html>
<html>
  <head>
    <title>Bicyling Map</title>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <style>
    /* TODO(james): I've just sort of copied random style stuff in here;
       should actually go through and see what it all does/remove extra junk.
       And style things in a clean way (unlike what we have now). */
    /* Always set the map height explicitly to define the size of the div
     * element that contains the map. */
    #map {
      height: 100%;
    }
    /* Optional: Makes the sample page fill the window. */
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    #floating-panel {
      position: absolute;
      top: 10px;
      left: 75%;
      z-index: 5;
      background-color: #fff;
      padding: 5px;
      border: 1px solid #999;
      text-align: center;
      font-family: 'Roboto','sans-serif';
      line-height: 30px;
      padding-left: 10px;
    }
    #right-panel {
      font-family: 'Roboto','sans-serif';
      line-height: 30px;
      padding-left: 10px;
    }

    #right-panel select, #right-panel input {
      font-size: 15px;
    }

    #right-panel select {
      width: 100%;
    }

    #right-panel i {
      font-size: 12px;
    }
    #right-panel {
      height: 100%;
      float: right;
      width: 390px;
      overflow: auto;
    }
    #map {
      margin-right: 400px;
    }
    #floating-panel {
      background: #fff;
      padding: 5px;
      font-size: 14px;
      font-family: Arial;
      border: 1px solid #ccc;
      box-shadow: 0 2px 2px rgba(33, 33, 33, 0.4);
      display: none;
    }
    @media print {
      #map {
        height: 500px;
        margin: 0;
      }
      #right-panel {
        float: none;
        width: auto;
      }
    }
    </style>
  </head>
  <body>
    <div id="floating-panel">
      <input id="start_address" type="textbox" value="City Hall" cols=150>
      <input id="end_address" type="textbox" value="WPI" cols=150>
      <input id="submit" type="button" value="Directions"> <br>

      <p>
      You can create parking icons by clicking on the map<br>
      and delete them by clicking them again. All markers will<br>
      save automatically.
      </p>
      <input id="traffic_radio" type="radio" name="layer_display" value="traffic"> Show Traffic <br>
      <input id="bike_radio" type="radio" name="layer_display" value="bicycle" checked> Show Bicycling <br>
      <input id="terrain_check" type="checkbox" checked> Show Elevation Lines <br>
      Edit Mode:
      <select id="edit_mode">
        <option value="view">View</option>
        <option value="parking">Parking</option>
        <option value="roads">Roads</option>
      </select> <br>
    </div>
    <div id="right-panel"></div>
    <div id="map"></div>

    <script src="https://code.jquery.com/jquery-1.9.1.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>

    <script type="text/javascript" src="js/flattest-route.js"></script>
    <script type="text/javascript" src="js/main.js"></script>
    <script async defer
         src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBTOnifJS1nT2W3MVVZKn36DYMVfc_PQRw&callback=initMap&libraries=places,drawing">
    </script>
  </body>
</html>
