DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS waypoints;
DROP TABLE IF EXISTS visibility;
DROP TABLE IF EXISTS track_groups;
DROP TABLE IF EXISTS point_groups;
DROP TABLE IF EXISTS users;

-- Users table schema
CREATE TABLE users (
	id serial PRIMARY KEY,
	name varchar(60) NOT NULL,
	email varchar(30) NOT NULL,
	password varchar(60) NOT NULL,
	CONSTRAINT unique_email UNIQUE(email)
);

-- Point groups schema
CREATE TABLE point_groups (
	id serial PRIMARY KEY,
	name varchar(30) NOT NULL,
	description varchar(255),
	CONSTRAINT unique_pgname UNIQUE(name)
);

INSERT INTO point_groups (name, description) VALUES ('general', NULL);

-- Track groups schema
CREATE TABLE track_groups (
	id serial PRIMARY KEY,
	name varchar(30),
	description varchar(255),
	CONSTRAINT unique_lgname UNIQUE(name)
);

INSERT INTO track_groups (name, description) VALUES ('general', NULL);

-- Visibility codes
CREATE TABLE visibility (
	id integer PRIMARY KEY,
	description varchar(10) NOT NULL UNIQUE,
	CONSTRAINT unique_desc UNIQUE(description)
);
INSERT INTO visibility VALUES (0, 'private');
INSERT INTO visibility VALUES (1, 'protected');
INSERT INTO visibility VALUES (2, 'public');

-- Waypoint table schema (WGS84)
CREATE TABLE waypoints (
	id serial PRIMARY KEY,
	user_id integer NOT NULL,
	geom geometry NOT NULL,
	time_stamp timestamp NOT NULL,
	group_id integer NOT NULL,
	visibility integer NOT NULL,
	comment varchar(100),
	CONSTRAINT user_ref FOREIGN KEY (user_id) REFERENCES users(id),
	CONSTRAINT group_ref FOREIGN KEY (group_id) REFERENCES point_groups(id),
	CONSTRAINT vis_ref FOREIGN KEY (visibility) REFERENCES visibility(id),
	CONSTRAINT geom_type CHECK (geometrytype(geom) = 'POINT'::text),
	CONSTRAINT geom_srid CHECK (st_srid(geom) = 4326)
);

-- Tracks table schema
CREATE TABLE tracks (
	id serial PRIMARY KEY,
	user_id integer NOT NULL,
	geom geometry NOT NULL,
	time_stamp timestamp NOT NULL,
	group_id integer NOT NULL,
	visibility integer NOT NULL,
	comment varchar(100),
	CONSTRAINT user_ref FOREIGN KEY (user_id) REFERENCES users(id),
	CONSTRAINT group_ref FOREIGN KEY (group_id) REFERENCES track_groups(id),
	CONSTRAINT vis_ref FOREIGN KEY (visibility) REFERENCES visibility(id),
	CONSTRAINT geom_type CHECK (geometrytype(geom) = 'LINESTRING'::text),
	CONSTRAINT geom_srid CHECK (st_srid(geom) = 4326)
);
