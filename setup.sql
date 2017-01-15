create table locations(id int unsigned auto_increment primary key, lat double, lon double, notes varchar(400), loc_type int);
create table roads(id int unsigned auto_increment, pindex int unsigned, lat double, lon double, line_type int, primary key(id, pindex));
