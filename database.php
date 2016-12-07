<?php
$servername = 'localhost';
$username = 'mapping';
$password = ADD_PASSWORD;
$database = 'bikemap';
error_reporting(E_ALL);
ini_set("display_errors", 1);
//$conn = new mysqli($servername, $username, $password, $database);
$conn = new mysqli('localhost', 'mapping', 'foobikemapbar', 'bikemap');
$action = $_REQUEST["action"];
if ($conn->connect_errno) {
      die('Could not connect: ' . mysqli_error($conn));
}

$parking_table = 'parking_location';
if ($action == "insert") {
  $lat = (double)$_REQUEST["lat"];
  $lon = (double)$_REQUEST["lon"];
  $sql = "insert into $parking_table (lat, lon) values ($lat, $lon )";
  if ($conn->query($sql) === TRUE) {
    $get_id_sql = "select id from $parking_table order by id desc limit 1";
    $result = $conn->query($get_id_sql);
    $id = $result->fetch_row()[0];
    echo "$id";
  }
} else if ($action == "remove") {
  $id = (int)$_REQUEST["id"];
  $sql = "delete from $parking_table where id = $id";
  if ($conn->query($sql) === FALSE) {
  }
} else if ($action == "fetch") {
  $sql = "select * from $parking_table";
  $results = $conn->query($sql);
  if ($results->num_rows > 0) {
    echo "[";
    $first = true;
    while ($row = $results->fetch_assoc()) {
      if ($first) {
        $first = false;
      } else {
        echo ",";
      }
      echo "[" . $row["id"]. ", " . $row["lat"]. ", " . $row["lon"]. "]";
    }
    echo "]";
  }
}

$conn->close();
?>
