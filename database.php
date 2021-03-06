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

$table = $conn->real_escape_string($_REQUEST['table']);
delete_val($keys, 'table');

require_once './includes/common.inc';
retrieve_session();
$valid_user = is_valid_user();
# If they are not a valid user, then they can only:
# -do fetch actions OR
# -do insert/delete actions on specifically allowed tables
$allowed_tables = ['suggested_locations', 'suggested_roads', 'votes'];
if (!$valid_user) {
  if ($action != "fetch") {
    if (!in_array($table, $allowed_tables)) {
      die('Invalid permissions');
    }
  }
}

// TODO(james): Properly escape everything for security, including the cols in
// the fetch and the variables in the insert and the id in the remove, as well
// as every other possible field.
if ($action == "insert") {
  $arraylen = count($keys);
  $format_str = "(";
  $val_array = array();
  for ($i = 0; $i < $arraylen; $i++) {
    $format_str .= $conn->real_escape_string($keys[$i]). ",";
    $new_val = json_decode($_REQUEST[$keys[$i]]);
    array_push($val_array, $new_val);
  }
  $format_str = rtrim($format_str, ',');
  $format_str .= ")";
  $val_str = "";
  // TODO(james): Do something about possibilities of different length arrays.
  for ($i = 0; $i < count($val_array[0]); $i++) {
    $val_str .= "(\"". $conn->real_escape_string($val_array[0][$i]). "\"";
    for ($j = 1; $j < count($val_array); $j++) {
      $val_str .= ",\"". $conn->real_escape_string($val_array[$j][$i]). "\"";
    }
    $val_str .= "),";
  }
  $val_str = rtrim($val_str, ',');
  if ($val_str == "") {
    $val_str = "()";
  }
  $sql = "insert into $table $format_str values $val_str";
  if ($conn->query($sql) === TRUE) {
    $get_id_sql = "select id from $table order by id desc limit 1";
    $result = $conn->query($get_id_sql);
    $id = $result->fetch_row()[0];
    // TODO(james): List all the IDs for inserting multiple rows.
    // TODO(james): Currently, not thread-safe. If a new row is inserted
    // before we check it, then we have an issue.
    echo "$id";
  } else {
    echo "Failed to perform query: ". $sql. "<br>";
    var_dump($sql);
  }
} else if ($action == "update") {
  $cond_string = $conn->real_escape_string($_REQUEST['where']);
  delete_val($keys, 'where');
  $arraylen = count($keys);
  if ($arraylen > 0) {
    $val_str = "";
    for ($i = 0; $i < $arraylen; $i++) {
      $val_str .= $conn->real_escape_string($keys[$i]). " = " .
                  $conn->real_escape_string($_REQUEST[$keys[$i]]) . ",";
    }
    $val_str = rtrim($val_str, ',');
    $val_str .= "";
    $sql = "update $table set $val_str where $cond_string";
    if ($conn->query($sql) === FALSE) {
      echo "Failed to perform query: ". $sql. "<br>";
      var_dump($sql);
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
        $val = json_encode($row[$cols[$i]]);
        if ($val == NULL) {
          $val = "null";
        }
        $result_str .= $val . ',';
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
