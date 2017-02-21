## About

See http://bikemap.wpi.edu/drupal7/?q=node/1

## Map

See the [User Manual](https://docs.google.com/document/d/1KfG-3zKTlq3rmvSNuxkPZQ3wR86Arn6HSODLmGciY7g/edit?usp=drive_web)
for information on how to _use_ the map.

See the [Technical Documentation](https://docs.google.com/document/d/1RnK6cNr9uUIWaiiOsIdOzKCjXmKY834luh3LB9z2GOs/edit?usp=drive_web)
for information on how we designed/programmed the map (and website).

For the map, some inspiration was gained from https://www.flattestroute.com

## TODO

 - See our [TODO list](https://docs.google.com/document/d/1hN95lKGK0LczzeK5_hWgq97AfTlux55bWj3nmAkd2xw/edit?usp=drive_web)
 - General code cleanup
 - Consider refactoring into a drupal module so that the map can be included inside the main website
 - See our [scripts](https://github.com/wpibikingmap/scripts) repository for some of the scripts run on the server

## Files

 - `*.html` redirect to `map.php`
 - `map.php` The page that the user goes to to see the map itself
 - `setup.sql` SQL statements to create the tables required for this all to run
 - `empty.png` A convenient transparent image that's used in a couple places
 - `css/main.css` The CSS for `map.php` Nothing too fancy
 - `includes/common.inc` PHP for validating users using Drupal
 - `js/flattest-route.js` Slightly modified code from [Flattest Route](https://github.com/Zivi/FlattestRoute)
 - `js/main.js` The majority of our website code
 - `database.php` An interface with the MySQL database that stores all the map information

## Notes

Currently, the Map itself accesses the Google Maps API through a free key from Google. If the website
gets to be used too much, then it may require a paid key, although I doubt we will reach that point
any time soon.

See the [Google Maps API Reference](https://developers.google.com/maps/documentation/javascript/3.exp/reference)
for some more information on their API, and for information on how to get an API Key.

In order to deploy the code, be sure to check the database settings in the top of `database.php`--at a minimum,
you will need to fill out a password, and unless you have our exact settings, you will need to
modify some other stuff.

If you are running on a server other than `bikemap.wpi.edu`, you may need to change some places where
it references `bikemap.wpi.edu` (eg, in `includes/common.inc`).
