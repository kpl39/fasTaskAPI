DROP TABLE IF EXISTS affiliations CASCADE;;
DROP TABLE IF EXISTS users CASCADE;;
DROP TABLE IF EXISTS tasks CASCADE;;
DROP TABLE IF EXISTS posts CASCADE;;
DROP TABLE IF EXISTS comments CASCADE;;

CREATE TABLE users (
  ID SERIAL PRIMARY KEY,
  USERID INT,
  EMAIL VARCHAR,
  USERNAME VARCHAR,
  PROFILEURL VARCHAR
);


CREATE TABLE affiliations (
  ID SERIAL PRIMARY KEY,
  USERID INT REFERENCES users(ID) ON DELETE CASCADE,
  CONFIRMED BOOLEAN
);

CREATE TABLE tasks (
  ID SERIAL PRIMARY KEY,
  USERID INT,
  TITLE VARCHAR,
  DESCRIPTION TEXT,
  IMAGEURL TEXT,
  ACTIVE BOOLEAN,
  STARTTIME VARCHAR,
  PRIZE VARCHAR,
  ENTRYDATE VARCHAR
);


CREATE TABLE posts (
  ID SERIAL PRIMARY KEY,
  POSTDATE VARCHAR,
  TASKID INT REFERENCES tasks(ID) ON DELETE CASCADE,
  USERID INT REFERENCES users(ID) ON DELETE CASCADE,
  USERNAME VARCHAR,
  IMAGEURL VARCHAR,
  AVATARURL VARCHAR,
  UPVOTES INT
);


CREATE TABLE comments (
  ID SERIAL PRIMARY KEY,
  POSTID INT REFERENCES posts(ID) ON DELETE CASCADE,
  USERID INT,
  USERNAME VARCHAR,
  COMMENT VARCHAR,
  AVATARURL VARCHAR
);


INSERT INTO users (EMAIL, USERNAME, PROFILEURL)
  VALUES ('kylelinhardt@gmail.com', 'kylelinhardt', 'http://content.sportslogos.net/logos/7/154/thumbs/377.gif');

INSERT INTO users (EMAIL, USERNAME, PROFILEURL)
  VALUES ('snoop@gmail.com', 'snoopdogg', 'https://s3.amazonaws.com/ionic-io-static/j9wO6FgsTLW082yfuhxx_snoop_dogg.jpg');

INSERT INTO users (EMAIL, USERNAME, PROFILEURL)
  VALUES ('2pac@gmail.com', '2pac', 'https://s3.amazonaws.com/ionic-io-static/6TdHn7TlQQWU8v920bs2_2pac.jpg');

INSERT INTO users (EMAIL, USERNAME, PROFILEURL)
  VALUES ('jimi@gmail.com', 'jimihendrix', 'https://s3.amazonaws.com/ionic-io-static/MrNZlJSQTuugSZQ3KWHF_jimi_hendrix.jpg');

INSERT INTO users (EMAIL, USERNAME, PROFILEURL)
  VALUES ('jimmypage@gmail.com', 'jimmypage', 'https://s3.amazonaws.com/ionic-io-static/0SCeIkjuSwW3gaQxpKHr_jimmy_page.jpg');

INSERT INTO users (EMAIL, USERNAME, PROFILEURL)
  VALUES ('50@gmail.com', '50cent', 'https://s3.amazonaws.com/ionic-io-static/CgQe8eVS6KCbTNrqX4Pg_50_cent.jpg');




INSERT INTO tasks (TITLE, DESCRIPTION, IMAGEURL)
  VALUES ('Take Selfie', 'Shoreditch before they sold out mixtape ugh tacos ethical butcher raw denim quinoa, glossier subway tile. Chambray kale chips chia hot chicken, cred tbh authentic normcore literally quinoa air plant.', '');


INSERT INTO tasks (TITLE, DESCRIPTION, IMAGEURL)
  VALUES ('SkateBoard', 'Synth sustainable la croix succulents. Lomo coloring book cardigan crucifix, locavore post-ironic slow-carb. Biodiesel vinyl williamsburg, occupy raw denim vape aesthetic hoodie gluten-free chambray kickstarter tote bag.', '');


INSERT INTO tasks (TITLE, DESCRIPTION, IMAGEURL)
  VALUES ('HandStand', 'Chillwave cliche unicorn polaroid, banjo heirloom cornhole chicharrones VHS shabby chic leggings small batch taxidermy salvia. Hot chicken pop-up hell of ennui master cleanse, portland everyday carry vegan knausgaard occupy thundercats.', '');

INSERT INTO tasks (TITLE, DESCRIPTION, IMAGEURL)
  VALUES ('Pet a Dog', 'Bushwick disrupt letterpress four loko health goth. Keytar kinfolk sustainable etsy, vexillologist bitters mumblecore. Pug echo park portland, pop-up art party distillery venmo YOLO tumeric.', '');





INSERT INTO posts(POSTDATE, TASKID, USERID, USERNAME, IMAGEURL, AVATARURL, UPVOTES)
  VALUES ('2016-12-24T02:05:37.916Z', 1, 1, 'kylelinhardt', 'https://s3.amazonaws.com/ionic-io-static/oM99xHuQoWY5VeP5wmxX_OneArmSplitHandstand.jpg', 'http://content.sportslogos.net/logos/7/154/thumbs/377.gif', 400);

INSERT INTO posts(POSTDATE, TASKID, USERID, USERNAME, IMAGEURL, AVATARURL, UPVOTES)
  VALUES ('2016-12-24T02:05:37.916Z', 1, 2, 'snoopdogg', 'https://s3.amazonaws.com/ionic-io-static/JGMAYmKxTfAoobrZD9Ow_handstand.jpg', 'https://s3.amazonaws.com/ionic-io-static/j9wO6FgsTLW082yfuhxx_snoop_dogg.jpg', 290);

INSERT INTO posts(POSTDATE, TASKID, USERID, USERNAME, IMAGEURL, AVATARURL, UPVOTES)
  VALUES ('2016-12-24T02:07:37.916Z', 1, 3, '2pac', 'https://s3.amazonaws.com/ionic-io-static/ypCHXVXXSTi0QNBAbjQB_handstand.jpg', 'https://s3.amazonaws.com/ionic-io-static/6TdHn7TlQQWU8v920bs2_2pac.jpg', 234);

INSERT INTO comments(POSTID, USERID, USERNAME, COMMENT, AVATARURL)
  VALUES (1, null, null, null, null);

INSERT INTO comments(POSTID, USERID, USERNAME, COMMENT, AVATARURL)
  VALUES (1, 6, '50cent', 'shits funny AF yo', 'https://s3.amazonaws.com/ionic-io-static/CgQe8eVS6KCbTNrqX4Pg_50_cent.jpg');

INSERT INTO comments(POSTID, USERID, USERNAME, COMMENT, AVATARURL)
  VALUES (1, 2, 'snoopdogg', 'lol', 'https://s3.amazonaws.com/ionic-io-static/j9wO6FgsTLW082yfuhxx_snoop_dogg.jpg');

INSERT INTO comments(POSTID, USERID, USERNAME, COMMENT, AVATARURL)
  VALUES (2, null, null, null, null);

INSERT INTO comments(POSTID, USERID, USERNAME, COMMENT, AVATARURL)
  VALUES (3, null, null, null, null);

