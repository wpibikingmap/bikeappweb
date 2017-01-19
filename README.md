## About

See http://bikemap.wpi.edu/drupal7/?q=node/1

## Map

For the map, some inspiration was gained from https://www.flattestroute.com

### Usage

In order to use the map, you fill in your origin and destination in the text fields in the control area and click the "Directions" button.

Directions will appear in the right sidebar and if there are multiple options for routes, you can select them in the top of the sidebar.

You can change which layer from Google is displayed by selecting show traffic/bicycling. These will show google's traffic and
bicycling data.

Selecting "Show Elevation Lines" will show Google's topographical layer.

Clicking on the "Legend" button will show/display the legend.

When you get directions, the directions will be colored to correspond to
steepness of grade. green=least steep, red=very steep, black=max steepness.
Black mostly shows up in rather extreme locations (eg, George Street).

When you are on the map that allows for editting (password-protected), then you can add/remove
markers and lines. I do not elaborate on those here.

### TODO

 - General code cleanup
 - Make the UI nice and understandable
 - Allow moving of parking icons (currently you can move them but they don't save).
 - Authentication on database access (to prevent anyone from adding/removing points)
 - Make a separate save button so that if someone screws up they don't accidentally
   mess up the master record.
 - Maybe an undo as well? That might be more difficult.
 - Rather than deleting on click, make everything expand to show some information
   on the feature and maybe include buttons for deleting and the such. Eg, when
   you click on parking icons, it pops up a brief description and maybe a picture
   of the parking.
 - Provide more explanation/data for the terrain component.

 - Make the roads disappear if not saved.
 - Better (any) security

### Reminders/Notes

 - When implementing authentication, refactor things to make it a Drupal module.
