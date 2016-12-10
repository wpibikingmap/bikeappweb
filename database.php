<?php

function delete_val(&$arr, $val) {
  $i = array_search($val, $arr);
  array_splice($arr, $i, 1);
}

$servername = 'localhost';
$username = 'mapping';
$password = ADD_PASSWORD;
$database = 'bikemap';
error_reporting(E_ALL);
ini_set("display_errors", 1);
//$conn = new mysqli($servername, $username, $password, $database);
$conn = new mysqli($servername, $username, $password, $database);
$keys = array_keys($_REQUEST);
$action = $_REQUEST["action"];
delete_val($keys, "action");
if ($conn->connect_errno) {
      die('Could not connect: ' . mysqli_error($conn));
}

$table = $_REQUEST['table'];
delete_val($keys, 'table');
if ($action == "insert") {
  $arraylen = count($keys);
  if ($arraylen > 0) {
    $format_str = "(";
    $val_array = array();
    for ($i = 0; $i < $arraylen; $i++) {
      $format_str .= $keys[$i]. ",";
      $new_val = json_decode($_REQUEST[$keys[$i]]);
      array_push($val_array, $new_val);
    }
    $format_str = rtrim($format_str, ',');
    $format_str .= ")";
    $val_str = "";
    // TODO(james): Do something about possibilities of different length arrays.
    for ($i = 0; $i < count($val_array[0]); $i++) {
      $val_str .= "(". $val_array[0][$i];
      for ($j = 1; $j < count($val_array); $j++) {
        $val_str .= ",". $val_array[$j][$i];
      }
      $val_str .= "),";
    }
    $val_str = rtrim($val_str, ',');
    $sql = "insert into $table $format_str values $val_str";
    if ($conn->query($sql) === TRUE) {
      $get_id_sql = "select id from $table order by id desc limit 1";
      $result = $conn->query($get_id_sql);
      $id = $result->fetch_row()[0];
      echo "$id";
    }
  }
} else if ($action == "remove") {
  $id = (int)$_REQUEST["id"];
  $sql = "delete from $table where id = $id";
  if ($conn->query($sql) === FALSE) {
  }
} else if ($action == "fetch") {
  $sql = "select * from $table";
  $results = $conn->query($sql);
  $result_str = "[";
  $cols = json_decode($_REQUEST["cols"]);
  if ($results->num_rows > 0) {
    while ($row = $results->fetch_assoc()) {
      $result_str .= '[';

      for ($i = 0; $i < count($cols); $i++) {
        $result_str .= $row[$cols[$i]] . ',';
      }

      $result_str = rtrim($result_str, ',');
      $result_str .= '],';
    }
    $result_str = rtrim($result_str, ',');
  }
  $result_str .= "]";
  echo $result_str;
}

$conn->close();
?>
