<?php
function retrieve_session() {
  global $base_url;
  $base_url = (array_key_exists('HTTPS', $_SERVER) ? 'https://' : 'http://') . "bikemap.wpi.edu/drupal7";
  define('DRUPAL_ROOT', '/usr/share/drupal7/');
  require_once DRUPAL_ROOT . './includes/bootstrap.inc';
  drupal_bootstrap(DRUPAL_BOOTSTRAP_SESSION);
}
function is_valid_user() {
  global $user;
  return key_exists(4, $user->roles);
}
function get_userid() {
  return $user->uid;
}
?>
