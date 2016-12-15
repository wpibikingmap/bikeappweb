create table parking_location(id int unsigned auto_increment primary key, lat double, lon double, notes varchar(400));
create table sharrows(id int unsigned auto_increment, pindex int unsigned, lat double, lon double, primary key(id, pindex));
