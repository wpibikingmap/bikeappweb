## Map

For the map, some inspiration was gained from https://www.flattestroute.com

### Usage

In order to use the map, you fill in your origin and destination in the text fields in the control area and click the "Directions" button.

Directions will appear in the right sidebar and if there are multiple options, you can select them in the top of the sidebar.

You can change which layer from google is displayed by selecting show traffic/bicycling. These will show google's traffic and
bicycling data.

Selecting "Show Elevation Lines" will show Google's topographical layer.

Changing the edit mode allows you to insert either parking icons or blue lines
that will snap to roads. No matter what mode you are in, clicking on any parking icon
or blue line will open a dialog box containing two things: (a) a delete button that
will permanently delete the icon and (b) optionally, some text providing more detail;
if the data entry person did not put in any text to display, then none will display.

When in an edit mode, clicking on the map will create the item in question:
 - Parking icons just appear where you click. When it appears, it will also show
   a text entry field where you indicate what you want to display to the user
   when they click on it (eg, mentioning that the bike racks are covered from rain).
 - For lines, you click and it will start drawing a line; click to create
   more points on the line. It will attempt to "snap" it to a road when you
   are done (when you are done, click again on the last point in the line to
   stop drawing). If you haven't drawn enough points it may fail to snap properly.

All changes are saved instantly and will show up when you reload the page.

FYI, blue lines are meant to be sharrows, but they don't have to be.

When you get directions, the directions will be colored to correspond to
steepness of grade. green=least steep, red=very steep, black=max steepness.
Black mostly shows up in rather extreme locations (eg, George Street).

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
 - Mobile friendly...

### Reminders/Notes

 - When implementing authentication, refactor things to make it a Drupal module.
