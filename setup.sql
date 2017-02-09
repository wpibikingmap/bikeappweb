create table votes(id int unsigned auto_increment primary key, upvotes int default 0, downvotes int default 0);
create table locations(id int unsigned auto_increment primary key, lat double, lon double, notes varchar(400), loc_type int, foreign key (id) references votes(id));
create table roads(id int unsigned auto_increment, pindex int unsigned, lat double, lon double, line_type int, notes varchar(400), primary key(id, pindex), foreign key (id) references votes(id));
create table suggested_locations(id int unsigned auto_increment primary key, lat double, lon double, notes varchar(400), loc_type int, foreign key (id) references votes(id));
create table suggested_roads(id int unsigned auto_increment, pindex int unsigned, lat double, lon double, line_type int, notes varchar(400), primary key(id, pindex), foreign key (id) references votes(id));
