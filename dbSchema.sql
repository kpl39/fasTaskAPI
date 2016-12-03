DROP TABLE IF EXISTS tasks;


CREATE TABLE tasks (
  ID SERIAL PRIMARY KEY,
  TITLE VARCHAR,
  DESCRIPTION TEXT,
  IMAGEURL TEXT
);


INSERT INTO tasks (TITLE, DESCRIPTION, IMAGEURL)
  VALUES ('Take Selfie', 'Shoreditch before they sold out mixtape ugh tacos ethical butcher raw denim quinoa, glossier subway tile. Chambray kale chips chia hot chicken, cred tbh authentic normcore literally quinoa air plant.', '');


INSERT INTO tasks (TITLE, DESCRIPTION, IMAGEURL)
  VALUES ('SkateBoard', 'Synth sustainable la croix succulents. Lomo coloring book cardigan crucifix, locavore post-ironic slow-carb. Biodiesel vinyl williamsburg, occupy raw denim vape aesthetic hoodie gluten-free chambray kickstarter tote bag.', '');


INSERT INTO tasks (TITLE, DESCRIPTION, IMAGEURL)
  VALUES ('HandStand', 'Chillwave cliche unicorn polaroid, banjo heirloom cornhole chicharrones VHS shabby chic leggings small batch taxidermy salvia. Hot chicken pop-up hell of ennui master cleanse, portland everyday carry vegan knausgaard occupy thundercats.', '');

INSERT INTO tasks (TITLE, DESCRIPTION, IMAGEURL)
  VALUES ('Pet a Dog', 'Bushwick disrupt letterpress four loko health goth. Keytar kinfolk sustainable etsy, vexillologist bitters mumblecore. Pug echo park portland, pop-up art party distillery venmo YOLO tumeric.', '');

