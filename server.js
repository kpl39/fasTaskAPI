var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var promise = require('bluebird');
var AWS = require('aws-sdk');
var fs = require('fs');
var cors = require('cors');
var request = require('request');
var OAuth   = require('oauth-1.0a');
var crypto  = require('crypto');

var PORT;



if (process.env.PORT) {
  PORT = process.env.PORT;
} else {
  PORT = 3000;
}

var corsOptions = {
  origin: 'https://s3.amazonaws.com/'
}


var app = express();
var server = http.createServer(app);

app.use(bodyParser.json({limit: '50mb'}));
app.use(express.static(__dirname));
// app.use(function (req, res, next) {


//     res.setHeader('Access-Control-Allow-Origin');

//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');


//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
// });

console.log("NEW EB DEPLOYMENT WORKS!");

app.use(cors())

var options = {
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
// console.log("PGP", pgp)

var twitterOAuth = OAuth({
      consumer: {
          key: process.env.TWITTER_CONSUMER_KEY,
          secret: process.env.TWITTER_CONSUMER_SECRET
      },
      signature_method: 'HMAC-SHA1',
      hash_function: function(base_string, key) {
          return crypto.createHmac('sha1', key).update(base_string).digest('base64');
      }
  });

var twitterToken = {
    key: process.env.TWITTER_ACCESS_TOKEN,
    secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
};




// if (process.env.DATABASE_URL) {
//   connectionString = process.env.DATABASE_URL + '?ssl=true';
// } else {
//   connectionString = 'postgres://localhost:5432/fastask'
// }

// console.log("database URL", connectionString);
console.log('port', PORT);


// app.get('/db', function (request, response) {
//   pg.connect(connectionString, function(err, client, done) {
//     console.log('client', client)
//     client.query('SELECT * FROM tasks', function(err, result) {
//       done();
//       if (err)
//        { console.error(err); response.send("Error " + err); }
//       else
//        // { response.render('pages/db', {results: result.rows} ); }
//         { response.send(result) }
//     });
//   });
// });
// AWS.config.loadFromPath('config.json');

var dbConnection = {
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT,
  database: process.env.RDS_DB_NAME
}

  


var db = pgp(dbConnection);

console.log(db);


  var respondWithData = function(res, message) {
    // console.log('**RESPOND WITH DATA**', message, res)
    return function(data) {
      console.log('DATA', data);
      res.status(200)
      .jsonp({
        status: 'success',
        data: data,
        message: message
      });
    }
  };

  var postData = function(res, message) {
    return function() {
      res.status(200)
        .json({
          status: 'success',
          message: message
        });
    }
  };


  var catchError = function(next) {
    return function(err){
      console.log(err);
      return next(err);
    };
  };

  app.get('/api/test', function(req, res, next) {
    res.status(200).jsonp("JSONP is working")
  })



  // app.get('/api/tasks', function(req, res, next) {
  //   console.log('ROUTE CALLED;')
  //   db.any('select * from tasks')
  //   .then(respondWithData(res, "Task Data"))
  //   .catch(catchError)
  // });


  app.get('/api/tasks', function(req, res, next) {
    console.log('ROUTE CALLED;')
    db.any('SELECT tasks.id, tasks.title, tasks.description, tasks.imageurl, tasks.active, tasks.starttime, tasks.entrydate, tasks.timed, tasks.locationbased, vendors.id vendor_id, vendors.vendor_nm, vendors.logourl vendor_logo, vendors.website, promotions.prize, promotions.id promotion_id FROM vendors INNER JOIN promotions ON vendors.id = promotions.vendorid INNER JOIN tasks ON promotions.taskid = tasks.id')
    .then(respondWithData(res, "Task Data"))
    .catch(catchError)
  });

  app.post('/api/tasksbydistance', function(req, res, next) {
    console.log("TASKS BY DISTANCE", req.body);
    var pkg = req.body;
    //WHERE acos(sin(radians(${latitude})) *sin(radians(geolocations.latitude)) + cos(radians(${latitude})) *cos(radians(geolocations.latitude))*cos(radians(geolocations.longitude)- radians(${longitude}))) * 3959 < ${radius}
    // db.any('Select id, latitude, longitude, acos(sin(radians( ${latitude} )) *sin(radians(latitude)) + cos(radians(${latitude})) *cos(radians(latitude))*cos(radians(longitude)- radians(${longitude}))) * 3959 As D From geolocations Where acos(sin(radians( ${latitude} )) *sin(radians(latitude)) + cos(radians(${latitude})) *cos(radians(latitude))*cos(radians(longitude)- radians(${longitude}))) * 3959 < ${radius}', pkg)
    db.any('SELECT geolocations.id geoid, geolocations.latitude, geolocations.longitude, acos(sin(radians(${latitude})) *sin(radians(geolocations.latitude)) + cos(radians(${latitude})) *cos(radians(geolocations.latitude))*cos(radians(geolocations.longitude)- radians(${longitude}))) * 3959 AS distance, tasks.id, tasks.title, tasks.description, tasks.imageurl, tasks.active, tasks.starttime, tasks.entrydate, tasks.timed, tasks.locationbased, tasks.national, tasks.endtime, tasks.ended, vendors.id vendor_id, vendors.vendor_nm, vendors.logourl vendor_logo, vendors.website, promotions.prize, promotions.id promotion_id FROM vendors INNER JOIN promotions ON vendors.id = promotions.vendorid INNER JOIN tasks ON promotions.taskid = tasks.id INNER JOIN geolocations ON tasks.id = geolocations.taskid', pkg)
    .then(respondWithData(res, "Task Data By Distance"))
    .catch(catchError)
  });



  app.get('/api/taskdetail/:id', function(req, res, next) {
    var taskID = parseInt(req.params.id);
    console.log('TASK ID = ', taskID);
    db.one('SELECT * FROM tasks WHERE id = $1', [taskID])
      .then(respondWithData(res, "task detail"))
      .catch(catchError)
  })


  // app.get('/api/posts/:taskid', function(req, res, next) {
  //   var taskID = parseInt(req.params.taskid);
  //   console.log('GET POSTS TASK ID = ', taskID);
  //   db.any('SELECT * FROM posts WHERE taskid = $1', [taskID])
  //     .then(respondWithData(res, "posts data"))
  //     .catch(catchError)
  // })

   app.get('/api/posts/:taskid', function(req, res, next) {
    var taskID = parseInt(req.params.taskid);
    console.log('GET POSTS TASK ID = ', taskID);
    db.any('SELECT posts.id, posts.postdate, posts.taskid, posts.userid, posts.username, posts.imageurl, posts.avatarurl, count(distinct likes.id) AS postlikes, count(distinct comments.id) AS commentcount FROM posts  INNER JOIN likes ON likes.postid = posts.id INNER JOIN comments ON posts.id = comments.postid WHERE posts.taskid = $1 GROUP BY posts.id;', [taskID])
      .then(respondWithData(res, "posts data"))
      .catch(catchError)
  })


  app.get('/api/userposts/:userid', function(req, res, next) {
    var userid = parseInt(req.params.userid);
    console.log('GET POSTS USER ID = ', userid);
    // db.any('SELECT * FROM posts where userid = $1', [userid])
    db.any('SELECT posts.id, posts.postdate, posts.taskid, posts.userid, posts.username, posts.imageurl, posts.avatarurl, count(distinct likes.id) AS postlikes, count(distinct comments.id) AS commentcount FROM posts  INNER JOIN likes ON likes.postid = posts.id INNER JOIN comments ON posts.id = comments.postid WHERE posts.userid = $1 GROUP BY posts.id;', [userid])
      .then(respondWithData(res, "posts data"))
      .catch(catchError)
  })


  app.get('/api/postdetail/:postid', function(req, res, next) {
    var postID = parseInt(req.params.postid);
    console.log('GET POST DETAIL', postID);
    db.one('SELECT * FROM posts where id = $1', [postID])
      .then(respondWithData(res, 'post detail data'))
      .catch(catchError)
  })

  app.get('/api/getusers/', function(req, res, next) {
    db.any('select username from users;')
      .then(respondWithData(res, 'usernames'))
      .catch(catchError)
  })



  // app.get('/api/commentcount/:postid', function(req, res, next){
  //   var postID = parseInt(req.params.postid);
  //   console.log('GET POST DETAIL', postID);
  //   db.any('SELECT count(*) FROM comments where postid = $1', [postID])
  //     .then(respondWithData(res, 'comments data'))
  //     .catch(catchError)
  // })




  app.get('/api/comments/:postid', function(req, res, next) {
    var postID = parseInt(req.params.postid);
    console.log('GET POST DETAIL', postID);
    db.any('SELECT * FROM comments where postid = $1', [postID])
      .then(respondWithData(res, 'comments data'))
      .catch(catchError)
  })

  app.post('/api/addcomment', function(req, res, next) {
    var pkg = req.body;
    console.log("PACKAGE from Server", pkg);
    db.none('INSERT INTO comments(POSTID, USERID, USERNAME, COMMENT, AVATARURL) VALUES(${postid}, ${userid}, ${username}, ${comment}, ${profileurl})', pkg)
      .then(postData(res, 'added comment'))
      .catch(catchError)
  })

  app.delete('/api/deletecomment/:id', function(req, res, next) {
    var commentId = parseInt(req.params.id);
    console.log("id from delete comment", commentId);

    db.none('DELETE FROM comments WHERE id = $1', [commentId])
      .then(postData(res, 'deleted comment'))
      .catch(catchError)
  })

  app.post('/api/addtask', function(req, res, next) {
    var pkg = req.body;

    console.log("ADD TASK PACKAGE", pkg);
    db.one('INSERT INTO tasks(TITLE, DESCRIPTION, IMAGEURL, ACTIVE, STARTTIME, PRIZE, ENTRYDATE, TIMED, LOCATIONBASED, WIKITUDE_FILE, ENDTIME, ENDED, NATIONAL, VENDORID) VALUES(${title}, ${description}, ${imageurl}, ${active}, ${starttime}, ${prize}, ${entrydate}, ${timed}, ${locationbased}, ${wikitude_file}, ${endtime}, ${ended}, ${national}, ${vendorid}) RETURNING id', pkg)
      .then(respondWithData(res, 'added task'))
      .catch(catchError)
  })






  // app.get('/api/useravatar/:userid', function(req, res, next) {
  //   var userID = parseInt(req.params.userid);
  //   console.log('GET  USER AVATAR', userID);
  //   db.one('SELECT users.profileurl from users where id = $1', [userID])
  //     .then(respondWithData(res, 'user avatar'))
  //     .catch(catchError)
  // })


  // app.post('api/tasks', function(req, res, next) {


  // })


  app.get('/api/users', function(req, res, next) {
    console.log('ROUTE CALLED;')
    db.any('select * from users')
      .then(respondWithData(res, "User Data"))
      .catch(catchError)
  });


  app.get('/api/username/:id', function(req, res, next) {
    var userId = parseInt(req.params.id);
    console.log(req.params.id);
    db.one('select exists(select 1 from users where userid = $1)', [userId])
      .then(respondWithData(res, "checked"))
      .catch(catchError)
  });

  app.put('/api/updateusername', function(req, res, next) {
    console.log('user pkg', req.body);
    db.none('UPDATE users SET username = ${username} WHERE userid = ${userid}', req.body)
      .then(postData(res, 'updated username'))
      .catch(catchError)
  })

  app.get('/api/checkuser/:id', function(req, res, next) {
    var userId = req.params.id ;
    console.log(req.params.id);
    db.one('select exists(select 1 from users where userid = $1)', [userId])
      .then(respondWithData(res, "checked"))
      .catch(catchError)
  });


  app.post('/api/adduser', function(req, res, next){
    var userInfo = req.body;
    console.log("Add user request body", req.body)
    db.none('INSERT INTO users(userid, username, email, profileurl) values(${userid}, ${username}, ${email}, ${profileurl})', req.body)
      .then(postData(res, 'posted data'))
      .catch(catchError)
  })

  app.get('/api/getprofile/:id', function(req, res, next) {
    var userid = req.params.id;
    console.log('user id', userid);
    db.one('SELECT * FROM users WHERE userid = $1', [userid])
      .then(respondWithData(res, "profile data"))
      .catch(catchError)
  })

  app.get('/api/getfastaskfriends/:userid', function(req, res, next) {
    var userid = req.params.userid;
    console.log('user id', userid);
    db.any('SELECT * FROM USERS WHERE USERID IN (SELECT USERID1 from affiliations WHERE CONFIRMED = true AND USERID1 = $1 OR USERID2 = $1) UNION SELECT * FROM USERS WHERE USERID IN (SELECT USERID2 from affiliations WHERE CONFIRMED = true AND USERID1 = $1 OR USERID2 = $1)', [userid])
      .then(respondWithData(res, "fastask friends data"))
      .catch(catchError)
  })

  app.post('/api/friendrequest', function(req, res, next) {
    console.log('friend request called', req.body);
    db.none('INSERT INTO affiliations(userid1, userid2, requestsent, confirmed, user1facebookid, user2facebookid) values(${user1}, ${user2}, ${requestsent}, ${confirmed}, ${user1facebookid}, ${user2facebookid} )', req.body)
      .then(postData(res, 'added friend request'))
      .catch(catchError)
  })

  app.get('/api/getfriendrequests/:userid', function(req, res, next) {
    var userid = req.params.userid;
    console.log('user id', userid);
    db.any('SELECT * FROM USERS WHERE USERID IN (SELECT USERID1 from affiliations WHERE REQUESTSENT = true AND CONFIRMED = false AND USERID2 = $1)', [userid])
      .then(respondWithData(res, "friend requests"))
      .catch(catchError)
  })

  app.get('/api/requeststatus/:userid', function(req, res, next) {
    var userid = req.params.userid;
    console.log('user id', userid);
    db.any('SELECT * FROM affiliations WHERE USERID1 = $1 OR USERID2 = $1', [userid])
      .then(respondWithData(res, "request status"))
      .catch(catchError)
  })

  app.put('/api/acceptrequest', function(req, res, next) {
    console.log('accept request data', req.body);
    db.none('UPDATE affiliations SET confirmed = true WHERE userid1 = ${requestor} AND userid2 = ${requestee}', req.body)
      .then(postData(res, 'added friend request'))
      .catch(catchError)
  })

  app.get('/api/getidfromfacebookid/:facebookid', function(req, res, next) {
    var facebookid = req.params.facebookid;

    db.one('SELECT userid from users where facebook_uid = $1', [facebookid])
      .then(respondWithData(res, "user id"))
      .catch(catchError)
  })

  app.post('/api/uploadpicture', function(req, res, next) {

    var img = req.body;
    // console.log('image', img.image);

    var buf = new Buffer(img.image.replace(/^data:image\/\w+;base64,/, ""),'base64')
    // console.log('upload picture', req.body);

    var s3 = new AWS.S3();


    // console.log("img:", img)
    var bucketName = 'fastaskbucket';
    var keyName = img.name;
    var folder = img.folder;
    var email = img.email;
    // var bodyName = img.image;
    // var bodyName = fs.createReadStream('fastask.png');


    var params = {Bucket: bucketName,
                  Key: folder + '/' + keyName,
                  Body: buf,
                  ContentEncoding: 'base64',
                  ContentType: 'image/jpeg',
                  ACL: 'public-read'};

    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully uploaded data to " + bucketName + "/" + folder + "/" + keyName);
      };
    });

    var urlParams = {Bucket: bucketName, Key: keyName};
    s3.getSignedUrl('getObject', urlParams, function(err, url) {
      res.status(200).send(url)
    });

    var profileUrl = 'https://s3.amazonaws.com/' + bucketName + '/' +  folder + "/" + keyName;
    console.log('email:', email)
    db.none('UPDATE users SET profileurl = coalesce($1, profileurl) WHERE userid=$2', [profileUrl, keyName])
      .then(postData(res, 'updated profile'))
      .catch(catchError)


  })


  app.post('/api/uploadtaskimage', function(req, res, next) {

    var img = req.body;

    var buf = new Buffer(img.image.replace(/^data:image\/\w+;base64,/, ""),'base64')

    var s3 = new AWS.S3({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});

    var bucketName = 'fastaskbucket';
    var keyName = img.vendorid;
    var folder = 'taskImages';
    var timestamp = new Date().getTime();
    var imageurl = 'https://s3.amazonaws.com/fastaskbucket/taskImages/' + keyName + '-' + timestamp;

    var params = {Bucket: bucketName,
                  Key: folder + '/' + keyName + '-' + timestamp,
                  Body: buf,
                  ContentEncoding: 'base64',
                  ContentType: 'image/jpeg',
                  ACL: 'public-read'};

    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully uploaded data to ", imageurl);
        res.status(200).send({data: imageurl});
      };
    });
  })


  app.post('/api/uploadprofileimage', function(req, res, next) {

    var img = req.body;
    console.log("IMAGE id", img.id);
    console.log("IMAGE USER ID", img.userid);
    var buf = new Buffer(img.image.replace(/^data:image\/\w+;base64,/, ""),'base64')

    var s3 = new AWS.S3({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});

    var bucketName = 'fastaskbucket';
    var keyName = img.userid;
    var folder = 'profileImages';
    var timestamp = new Date().getTime();
    var imageurl = 'https://s3.amazonaws.com/' + bucketName + '/' + folder + '/' + keyName + '-' + timestamp;

    var params = {Bucket: bucketName,
                  Key: folder + '/' + keyName + '-' + timestamp,
                  Body: buf,
                  ContentEncoding: 'base64',
                  ContentType: 'image/jpeg',
                  ACL: 'public-read'};

    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully uploaded data to ", imageurl);
        
        db.one('UPDATE users SET profileurl = coalesce($1, profileurl) WHERE id=$2 returning profileurl', [imageurl, img.id])
        .then(respondWithData(res, 'updated profile image'))
        .catch(catchError)
      };
    });
  })


  app.put('/api/updateprofilepic', function(req, res, next) {
      var profileUrl = req.body.profileurl;
      var userId = req.body.userId;

     db.none('UPDATE users SET profileurl = coalesce($1, profileurl) WHERE userid=$2', [profileUrl, userId])
      .then(postData(res, 'updated profile'))
      .catch(catchError)
  })



  // app.post('/api/uploadtaskimage', function(req, res, next) {
  //   console.log("upload picture called *****", req.body);
  //   var task = req.body;

    // db.none('INSERT INTO affiliations(userid1, userid2, requestsent, confirmed) values(${user1}, ${user2}, ${requestsent}, ${confirmed})', req.body)

    // db.none('INSERT INTO posts(postdate, taskid, userid, username, imageurl, avatarurl) values(${date}, ${taskid}, ${userid}, ${username}, ${imageurl}, ${avatarurl})', task)
    //   .then(postData(res, 'task completed'))
    //   .catch(catchError(next));
  // });

  app.post('/api/completetask', function(req, res, next) {
    console.log('REQUEST BODY FROM COMPLETE TASK', req.body);


    db.one('INSERT INTO posts(postdate, taskid, userid, username, imageurl, avatarurl, upvotes) values(${date}, ${taskid}, (SELECT id FROM users WHERE userid = ${userid}), ${username}, ${imageurl}, ${avatarurl}, ${upvotes}) returning *', req.body)
        .then(respondWithData(res, 'task completed'))
        .catch(catchError(next));
  });

  app.get('/api/geolocations/:taskid', cors(), function(req, res, next) {
    var taskid = req.params.taskid;
    console.log('GET GEOLOCATIONS ENDPOINT CALLED TASKID: ', taskid);

    db.any('SELECT g.id, g.latitude, g.longitude, g.altitude, g.discoveryradius, g.modelpath, g.modelfilename, g.discovered, g.discover_dt_tm, m.title, m.image_url, m.model_url, m.xscale, m.yscale, m.zscale, m.roll, m.tilt, m.heading, m.model_uid FROM geolocations g INNER JOIN models m ON g.model_id = m.id WHERE taskid = $1', [taskid])
    //'SELECT * FROM geolocations WHERE taskid = $1', [taskid])
      .then(respondWithData(res, 'geolocations for taskid'))
      .catch(catchError(next));
  });


  //'SELECT g.id, g.latitude, g.longitude, g.altitude, g.discoveryradius, g.modelpath, g.modelfilename, g.discovered, g.discover_dt_tm, m.title, m.image_url, m.model_url, m.xscale, m.yscale, m.zscale, m.roll, m.tilt, m.heading, m.model_uid FROM geolocations g INNER JOIN models ON g.model_id = m.id WHERE taskid = $1', [taskid])

  app.put('/api/geolocations', function(req, res, next) {
    console.log('Discover Geolocation', req.body);
    db.none('UPDATE geolocations SET discovered = true WHERE id = ${id} AND taskid = ${taskid}', req.body)
      .then(postData(res, 'discovered geolocation, id: ' + req.body.id))
      .catch(catchError(next));
  });

  app.post('/api/addwinner', function(req, res, next) {
    console.log('Add Winner Called', req.body);

    db.none('INSERT into winners (userid, promotionid, win_dt_tm) values((SELECT id FROM users WHERE userid = ${userid}), (SELECT id FROM promotions WHERE taskid = ${taskid}), ${win_dt_tm})', req.body)
        .then(postData(res, 'added winner'))
        .catch(catchError(next));
  });

  app.get('/api/userwins/:userid', function(req, res, next) {
    var userid = req.params.userid;
    console.log("Called USER WINs ENDPOINT, USERID: ", userid);

    db.any('SELECT vendors.vendor_nm, vendors.logourl, promotions.prize, tasks.title FROM promotions INNER JOIN vendors ON promotions.vendorid = vendors.id INNER JOIN tasks ON promotions.taskid = tasks.id where promotions.id IN (select promotionid from winners where userid = (SELECT id FROM users WHERE userid = $1))', [userid])
        .then(respondWithData(res, 'userid: ' + userid + ' wins'))
        .catch(catchError(next));
  });

  app.post('/api/addlike', function(req, res, next) {
  console.log("ADD LIKE ENDPOINT CALLED: ", req.body);

  db.none('INSERT INTO likes(postid, userid, date_tm, taskid) VALUES(${postid}, (SELECT id FROM users WHERE userid = ${userid}), ${date_tm}, ${taskid})', req.body)
      .then(postData(res, 'added like'))
      .catch(catchError(next));
})



  app.get('/api/getlikes/:taskid/:userid', function(req, res, next) {
    console.log("GET LIKES CALLED", req.params);
    var taskid = req.params.taskid;
    var userid = req.params.userid;

    db.any('SELECT * FROM likes WHERE taskid = $1 AND userid = (SELECT id FROM users WHERE userid = $2)', [taskid, userid])
        .then(respondWithData(res, 'here are the likes for userid: ' + userid + ' and taskid: ' + taskid))
        .catch(catchError(next));

  })

  app.delete('/api/removelike/:postid/:userid/:taskid', function(req, res, next) {
    console.log("REMOVE LIKES CALLED", req.body);
    var postid = req.params.postid;
    var userid = req.params.userid;
    var taskid = req.params.taskid;


    db.none('DELETE FROM likes WHERE postid = $1 AND userid = (SELECT id FROM users WHERE userid = $2) AND taskid = $3', [postid, userid, taskid])
        .then(postData(res, 'removed like'))
        .catch(catchError(next));
  });

  app.get('/api/getmodels', function(req, res, next) {

    db.any('SELECT * FROM models')
        .then(respondWithData(res, 'here are the models'))
        .catch(catchError(next));
  });

  app.get('/api/getmodel/:modelid', function(req, res, next) {
    var modelid = req.params.modelid;

    db.one('SELECT * FROM models where id = $1', [modelid])
      .then(respondWithData(res, 'heres the model for id: ' + modelid))
      .catch(catchError(next));
  });

  app.get('/api/getmodelid/:modeluid', function(req, res, next) {
    var modeluid = req.params.modeluid;

    db.one('SELECT id FROM models where model_uid = $1', [modeluid])
      .then(respondWithData(res, 'model id for uid: ' + modeluid))
      .catch(catchError(next));
  });

   app.post('/api/submithunt', function(req, res, next) {
 
      db.one('INSERT INTO hunts(title, description, date_tm, team, duration, active, ended) VALUES(${title}, ${description}, ${date_tm}, ${team}, ${duration}, ${active}, ${ended}) returning *', req.body)
        .then(respondWithData(res, 'added hunt'))
        .catch(catchError(next));
  });


  app.post('/api/submithunttasks', function(req, res, next) {

    console.log("SUBMIT HUNT TASKS", req.body);

    var cs = new pgp.helpers.ColumnSet(['hunt_id', 'title', 'hint', 'latitude', 'longitude', 'model_id', 'type', 'points'], {table: 'hunt_tasks'});

    var values = req.body; 

    var query = pgp.helpers.insert(values, cs) + 'RETURNING id';

    db.many(query)
      .then(respondWithData(res, 'added hunt tasks'))
      .catch(catchError(next));
 
      // db.none('INSERT INTO hunt_tasks(hunt_id, title, hint, latitude, longitude, model_id) VALUES $1', Inserts('${hunt_id}, ${title}, ${hint}, ${latitude}, ${longitude}, ${model_id}', req.body))
      //   .then(postData(res, 'added hunt tasks'))
      //   .catch(catchError(next));
  });

  app.get('/api/gethunttasks/:huntid/:userid', function(req, res, next) {
    var huntid = req.params.huntid; 
    var userid = req.params.userid;
    // db.any('SELECT hunt_tasks.id, hunt_tasks.title, hunt_tasks.hint, hunt_tasks.type, hunt_tasks.latitude, hunt_tasks.longitude, hunt_tasks.model_id, models.image_url FROM hunt_tasks INNER JOIN models ON hunt_tasks.model_id = models.id WHERE hunt_id = $1', [huntid])
    db.any('SELECT hunt_task_complete.completed, hunt_task_complete.image_url as picture, hunt_task_complete.date_tm, hunt_tasks.id, hunt_tasks.title, hunt_tasks.hint, hunt_tasks.type, hunt_tasks.latitude, hunt_tasks.longitude, hunt_tasks.model_id, hunt_tasks.points, models.image_url FROM hunt_task_complete RIGHT JOIN hunt_tasks ON hunt_task_complete.task_id = hunt_tasks.id INNER JOIN models ON hunt_tasks.model_id = models.id WHERE hunt_tasks.hunt_id = $1 AND hunt_task_complete.user_id = $2', [huntid, userid])

      .then(respondWithData(res, 'hunt tasks for id: ', huntid))
      .catch(catchError(next));
  })

  app.get('/api/gethunttasksbyhunt/:huntid', function(req, res, next) {
    var huntid = req.params.huntid;

    db.any('SELECT * FROM hunt_tasks WHERE hunt_id = $1', [huntid])
      .then(respondWithData(res, 'hunt tasks for hunt_id: ', huntid))
      .catch(catchError(next));
  })

  app.post('/api/submithuntusers', function(req, res, next) {
    console.log("HUNT USERS", req.body);

    var cs = new pgp.helpers.ColumnSet(['hunt_id', 'user_id', 'admin', 'accepted', 'declined', 'total_points'], {table: 'hunt_users'});

    var values = req.body; 

    var query = pgp.helpers.insert(values, cs) + 'RETURNING id';

    db.many(query)
      .then(respondWithData(res, 'added hunt users'))
      .catch(catchError(next));
  });

  app.get('/api/getuserhunts/:userid', function(req, res, next) {

    var userid = req.params.userid;

    db.any('SELECT  hunts.id as huntid, hunts.title, hunts.description, hunts.date_tm, hunts.team, hunts.duration, hunts.active, hunts.ended, users.id as adminid, users.userid, users.username, users.email, users.profileurl FROM users INNER JOIN hunt_users ON users.id = hunt_users.user_id INNER JOIN hunts ON hunt_users.hunt_id = hunts.id WHERE hunt_users.hunt_id IN (SELECT hunts.id from hunts INNER JOIN hunt_users ON hunt_users.hunt_id = hunts.id WHERE hunt_users.user_id = $1) AND hunt_users.admin = true', userid)
        .then(respondWithData(res, 'here are the scavenger hunts'))
        .catch(catchError(next));
  });

  app.get('/api/gethuntaccepts/:userid', function(req, res, next) {
    var userid = req.params.userid; 

    db.any('SELECT hunt_id, accepted, declined from hunt_users WHERE user_id = $1', userid)
       .then(respondWithData(res, 'here are the scavenger hunts'))
        .catch(catchError(next));
  })

  app.put('/api/accepthunt', function(req, res, next) {
  

    db.none('UPDATE hunt_users SET(declined, accepted) = (false, true) WHERE user_id = ${userid} AND hunt_id = ${hunt_id}', req.body)
      .then(postData(res, 'accepted hunt'))
      .catch(catchError)
  })

  app.put('/api/declinehunt', function(req, res, next) {
    db.none('UPDATE hunt_users SET(declined, accepted) = (true, false) WHERE user_id = ${userid} AND hunt_id = ${hunt_id}', req.body)
      .then(postData(res, 'declined hunt'))
      .catch(catchError)
  })


 

  app.post('/api/addcomplete', function(req, res, next) {
    var cs = new pgp.helpers.ColumnSet(['hunt_id', 'task_id', 'user_id', 'team_id', 'completed', 'date_tm', 'image_url'], {table: 'hunt_task_complete'});

    var values = req.body; 

    var query = pgp.helpers.insert(values, cs) + 'RETURNING id, hunt_id';

    db.many(query)
      .then(respondWithData(res, 'added tasks for user'))
      .catch(catchError(next));
    // db.none('INSERT INTO hunt_task_complete(hunt_id, task_id, user_id, team_id, completed, date_tm, image_url) VALUES(${hunt_id}, ${task_id}, ${user_id}, ${team_id}, ${completed}, ${date_tm}, ${image_url})', req.body)
    //   .then(postData(res, 'add blank completed record'))
    //   .catch(catchError)
  })

  app.put('/api/completehunttask', function(req, res, next) {
    console.log("COMPLETE HUNT TASK", req.body);
    db.none('UPDATE hunt_task_complete SET (completed, image_url, date_tm) = (true, ${image_url}, ${date_tm}) WHERE task_id = ${task_id} AND user_id = ${user_id}', req.body)
      .then(postData(res, 'update complete task record'))
      .catch(catchError)
  })

  app.post('/api/addteamstohunt', function(req, res, next) {
    var cs = new pgp.helpers.ColumnSet(['title', 'hunt_id', 'total_points'], {table: 'teams'});

    var values = req.body; 

    var query = pgp.helpers.insert(values, cs) + 'RETURNING id, title';

    db.many(query)
      .then(respondWithData(res, 'added teams to hunt'))
      .catch(catchError(next));
  })

  app.post('/api/adduserstoteams', function(req, res, next) {
    var cs = new pgp.helpers.ColumnSet(['user_id', 'team_id'], {table: 'team_membership'});

    var values = req.body; 

    var query = pgp.helpers.insert(values, cs) + 'RETURNING id, user_id, team_id';

    db.many(query)
      .then(respondWithData(res, 'added users to teams'))
      .catch(catchError(next));
  })


  app.get('/api/getuserteambyhunt/:hunt_id/:user_id', function(req, res, next) {
    var hunt_id = req.params.hunt_id;
    var user_id = req.params.user_id;

    db.one('SELECT teams.id FROM teams INNER JOIN team_membership ON team_membership.team_id = teams.id WHERE teams.hunt_id = $1 AND team_membership.user_id = $2', [hunt_id, user_id])
      .then(respondWithData(res, 'here is the team id'))
      .catch(catchError(next));
  })


  app.get('/api/gethuntusers/:hunt_id', function(req, res, next) {
    var hunt_id = req.params.hunt_id;


    db.any('SELECT hunt_users.accepted, hunt_users.declined, users.id, users.profileurl, users.username FROM hunt_users INNER JOIN users ON hunt_users.user_id = users.id WHERE hunt_users.hunt_id = $1', [hunt_id])
      .then(respondWithData(res, 'here is the team id'))
      .catch(catchError(next));
  })

  app.get('/api/getteamusercompletes/:hunt_id/:user_id', function(req, res, next) {
    var hunt_id = req.params.hunt_id;
    var user_id = req.params.user_id;


    db.any('SELECT hunt_task_complete.user_id, hunt_task_complete.completed, hunt_task_complete.date_tm, hunt_task_complete.image_url, hunt_task_complete.task_id, users.username, users.profileurl, hunt_tasks.title, hunt_tasks.points FROM hunt_tasks INNER JOIN hunt_task_complete ON hunt_tasks.id = hunt_task_complete.task_id INNER JOIN users ON hunt_task_complete.user_id = users.id WHERE hunt_task_complete.hunt_id = $1 AND user_id IN (SELECT users.id FROM users INNER JOIN team_membership ON users.id = team_membership.user_id INNER JOIN teams ON team_membership.team_id = teams.id WHERE teams.id IN (SELECT team_id FROM team_membership where user_id = $2) AND teams.hunt_id = $1)', [hunt_id, user_id])
      .then(respondWithData(res, 'all users on team for this hunt with complete or not on all tasks'))
      .catch(catchError(next));
  })

  app.get('/api/getuserteam/:hunt_id/:user_id', function(req, res, next) {
    var hunt_id = req.params.hunt_id;
    var user_id = req.params.user_id;


    db.any('SELECT id, title FROM teams WHERE id IN (SELECT team_id FROM team_membership where user_id = $2) AND hunt_id = $1;', [hunt_id, user_id])
      .then(respondWithData(res, 'Users Team Title and ID'))
      .catch(catchError(next));
  })



  app.put('/api/starthunt', function(req, res, next) {
    var hunt_id = req.body.hunt_id; 

    db.none('UPDATE hunts SET active = coalesce(true, active) WHERE id=$1', [hunt_id])
    .then(postData(res, 'hunt: ' + hunt_id + ' is active'))
    .catch(catchError)
  })


  app.put('/api/endhunt', function(req, res, next) {
    var hunt_id = req.body.hunt_id; 

    db.none('UPDATE hunts SET ended = coalesce(true, ended), active = coalesce(false, active) WHERE id=$1', [hunt_id])
    .then(postData(res, 'hunt: ' + hunt_id + ' has ended'))
    .catch(catchError)
  })

  
  app.get('/api/gethuntresults/:huntid', function(req, res, next) {
    var hunt_id = req.params.huntid;

    db.any('SELECT hunt_task_complete.id, hunt_task_complete.hunt_id, hunt_task_complete.task_id, hunt_task_complete.user_id, hunt_task_complete.team_id, hunt_task_complete.completed, hunt_task_complete.date_tm, hunt_task_complete.image_url, users.username, users.profileurl, teams.title as team_name, teams.total_points as team_points, hunt_tasks.title as task_title, hunt_tasks.type as task_type, hunt_tasks.points as task_points FROM teams RIGHT JOIN hunt_task_complete ON teams.id = hunt_task_complete.team_id INNER JOIN users ON hunt_task_complete.user_id = users.id INNER JOIN hunt_tasks ON hunt_task_complete.task_id = hunt_tasks.id WHERE hunt_task_complete.hunt_id = $1', [hunt_id])
      .then(respondWithData(res, 'Results for Hunt: ' + hunt_id))
      .catch(catchError(next));
  })


  app.get('/api/gethuntuserresults/:huntid', function(req, res, next) {
    var hunt_id = req.params.huntid;

    db.any('SELECT hunt_users.total_points, users.id, users.username, users.profileurl FROM hunt_users INNER JOIN users ON hunt_users.user_id = users.id WHERE hunt_users.hunt_id = $1', [hunt_id])
      .then(respondWithData(res, 'Results for Users of Hunt: ' + hunt_id))
      .catch(catchError(next));
  });

  app.post('/api/teamscores', function(req, res, next) {
    console.log("TEAM SCORES", req.body);

     var cs = new pgp.helpers.ColumnSet(['?id', 'total_points'], {table: 'teams'});

    var values = req.body; 

    var query = pgp.helpers.update(values, cs) + 'WHERE t.id = v.id RETURNING t.id, t.total_points';

    db.many(query)
      .then(respondWithData(res, 'compiled team points'))
      .catch(catchError(next));

  })



  app.post('/api/userscores', function(req, res, next) {
    console.log("User SCORES", req.body);

     var cs = new pgp.helpers.ColumnSet(['?hunt_id', '?user_id', 'total_points'], {table: 'hunt_users'});

    var values = req.body; 

    var query = pgp.helpers.update(values, cs) + 'WHERE t.hunt_id = v.hunt_id  AND t.user_id = v.user_id RETURNING t.id, t.total_points';

    db.many(query)
      .then(respondWithData(res, 'compiled user points'))
      .catch(catchError(next));

  })

  app.post('/api/captcha', function(req, res, next) {
    var secret = '6LfwIyYUAAAAAPBdFdRPNZ7c-llt0nBb7O9DSUP0';
    var response = req.body.response;

    console.log("IN CAPTCHA", response);

    request.post({
      url:'https://www.google.com/recaptcha/api/siteverify', 
      form: {
        secret: secret,
        response:response}
      }, 
      function(err,httpResponse,body){ 
        if (err) {
          console.log("Error: ", err)
          return next(error)
        } else {
          console.log("RESPONSE", body);
          return res.status(200)
            .jsonp({
              status: 'success',
              data: body,
              message: 'response from captcha'
            });
        };
      })
    })


  app.get('/api/getvendorinfo/:vendorid', function(req, res, next) {
    var vendor_id = req.params.vendorid; 

    db.any('SELECT * FROM vendors WHERE id = $1', [vendor_id])
      .then(respondWithData(res, 'Vendor Info'))
      .catch(catchError(next));

  })

  app.post('/api/addcustomer', function(req, res, next) {
    var pkg = req.body;

    //INSERT INTO hunts(title, description, date_tm, team, duration, active, ended) VALUES(${title}, ${description}, ${date_tm}, ${team}, ${duration}, ${active}, ${ended}) returning *', req.body)

    db.one('INSERT INTO vendors(vendor_nm, city, state, zip, phone, email, website, first_name, last_name) VALUES(${businessName}, ${city}, ${state},  ${zip}, ${phone}, ${email}, ${businessWebsite}, ${firstName}, ${lastName}) RETURNING id', pkg)
      .then(respondWithData(res, 'Vendor ID'))
      .catch(catchError(next));
  })


  app.get('/api/getmodelid/:uid', function(req, res, next) {
    var uid = req.params.uid;

    db.one('SELECT ID from models WHERE model_uid = $1', [uid])
      .then(respondWithData(res, 'Model ID'))
      .catch(catchError(next));

  })

  app.post('/api/addgeolocations', function(req, res, next) {
    var pkg = req.body;

    console.log("GEOLOCATIONS", pkg);

    var cs = new pgp.helpers.ColumnSet(['taskid', 'model_id', 'latitude', 'longitude', 'discovered'], {table: 'geolocations'});

    var values = pkg;

    var query = pgp.helpers.insert(values, cs) + 'RETURNING id';

    db.many(query)
      .then(respondWithData(res, 'added geolcations for task ID: ', pkg.taskid))
      .catch(catchError(next));
  })

  app.post('/api/addpromotion', function(req, res, next) {
    var pkg = req.body; 

    db.one('INSERT INTO promotions(vendorid, taskid, prize) VALUES(${vendorid}, ${taskid}, ${prize}) RETURNING id', pkg)
      .then(respondWithData(res, 'added promotion ', pkg.taskid))
      .catch(catchError(next));
  })

  app.get('/api/checkemail/:email', function(req, res, next) {
    var email = req.params.email;

    db.one('SELECT (SELECT id from users WHERE email = $1) as user, (SELECT id FROM vendors WHERE email = $1) as vendor', [email])
      .then(respondWithData(res, 'email vendor or user'))
      .catch(catchError(next));
  })


  app.get('/api/getfavoritetasks/:userid', function(req, res, next) {
    var userid = req.params.userid

    db.any('SELECT ft.id, ft.global, ft.owner_id, ft.title, ft.description, uf.id as fav_id from favorite_task as ft LEFT JOIN user_favorite as uf ON ft.id = uf.favorite_id WHERE ft.owner_id = $1 OR ft.global = true OR uf.user_id = $1;', [userid])
      .then(respondWithData(res, 'favorite tasks'))
      .catch(catchError(next));
  })

  app.post('/api/addfavoritetask', function(req, res, next) {
    var pkg = req.body; 

    db.one('INSERT INTO favorite_task (global, owner_id, title, description) VALUES(${global}, ${user_id}, ${title}, ${description}) RETURNING id', pkg)
      .then(respondWithData(res, 'added favorite task'))
      .catch(catchError(next));
  })


  app.get('/api/twitterfriends/:twitterid', function(req, res, next) {
      var twitterid = req.params.twitterid;

      var request_data = {
          url: 'https://api.twitter.com/1.1/friends/ids.json?user_id=' + twitterid,
          method: 'GET'
      };

      request({
        url: request_data.url,
        method: request_data.method,
        headers: twitterOAuth.toHeader(twitterOAuth.authorize(request_data, twitterToken))
      }, function(error, response, body) {
            if (error) {
              console.log("ERROR", error);   
            } else {
              console.log("TWITTER REQUEST ", body);
              // res.status(200).json({
              //                         status: 'success',
              //                         data: body,
              //                         message: 'friends for user ' + twitterid
              //                       });
              let friends = JSON.parse(body).ids; 
              db.any('SELECT * FROM users WHERE twitter_uid IN ($1:csv)', [friends])
                  .then(respondWithData(res, 'twitter users'))
                  .catch(catchError(next));
            }

            //Eventually run the IDs against the users table to return only LuT && Twitter Users
            //SELECT * FROM users WHERE twitterid IN %data returned from twitter api 
      });
    })




  







  //   var options = {
  //     method: 'POST',
  //     uri: 'https://www.google.com/recaptcha/api/siteverify',
  //     form: {
  //       secret: secret,
  //       response:response}
  //     };
 
  //   rp(options)
  //     .then(respondWithData(body, 'response from captcha'))
  //     .catch(catchError(err));
  // });

  server.listen(PORT, function(){
    console.log('Server Listening on Port:' + PORT);
  })





// SELECT * FROM AFFILIATIONS WHERE USERID1 = '100684900435655' OR USERID2 = '100684900435655'





// SELECT * FROM USERS WHERE USERID IN (SELECT USERID1 from affiliations WHERE USERID1 = '100684900435655' OR USERID2 = '100684900435655') UNION SELECT * FROM USERS WHERE USERID IN (SELECT USERID2 from affiliations WHERE USERID1 = '100684900435655' OR USERID2 = '100684900435655');





  // pendingRequestAlert(friend) {
  //   let alert = this.alertCtrl.create({
  //     title: 'Friend Request Pending',
  //     subTitle: friend.name + 'sent you a friend request. Go check it out.' ,
  //     buttons: ['OK']
  //   });
  //   alert.present();
  // }



//SELECT hunt_users.accepted, hunt_users.declined, users.id as user_id, users.username, team_membership.team_id FROM hunt_users INNER JOIN users ON hunt_users.user_id = users.id LEFT JOIN team_membership ON team_membership.user_id = users.id  WHERE hunt_users.hunt_id = 36;
 

//SELECT hunt_users.total_points, users.id, users.username, users.profileurl FROM hunt_users INNER JOIN users ON hunt_users.user_id = users.id WHERE hunt_users.hunt_id = 52 ORDER BY hunt_users.total_points DESC; 



//SELECT hunt_users.hunt_id, hunt_users.accepted, hunt_users.declined, users.id as user_id, users.username, team_membership.team_id, teams.title FROM hunts INNER JOIN  teams ON hunts.id = teams.hunt_id INNER JOIN team_membership ON teams.id = team_membership.team_id RIGHT JOIN users ON team_membership.user_id = users.id INNER JOIN hunt_users ON users.id = hunt_users.user_id WHERE hunt_users.hunt_id = 36;



//just to get user info no teams
// SELECT hunt_users.accepted, hunt_users.declined, users.id, users.profileurl, users.username FROM hunt_users INNER JOIN users ON hunt_users.user_id = users.id WHERE hunt_users.hunt_id = 36;


//SELECT tasks.id, tasks.title, tasks.description, tasks.imageurl, tasks.active, tasks.starttime, tasks.entrydate, tasks.timed, tasks.locationbased, vendors.id vendor_id, vendors.vendor_nm, vendors.logourl vendor_logo, vendors.website, promotions.prize, promotions.id promotion_id FROM vendors INNER JOIN promotions ON vendors.id = promotions.vendorid INNER JOIN tasks ON promotions.taskid = tasks.id WHERE tasks.id = 1;



// SELECT users.id, users.username, users.profileurl, teams.title FROM users INNER JOIN team_membership ON users.id = team_membership.user_id INNER JOIN teams ON team_membership.team_id = teams.id WHERE teams.id IN (SELECT team_id FROM team_membership where user_id = 10) AND teams.hunt_id = 33;

      
//SELECT hunt_task_complete.user_id, hunt_task_complete.completed, hunt_task_complete.date_tm, hunt_task_complete.image_url, users.username, users.profileurl, teams.title FROM hunt_task_complete INNER JOIN users ON hunt_task_complete.user_id = users.id INNER JOIN team_membership ON users.id = team_membership.user_id INNER JOIN teams ON team_membership.team_id = teams.id WHERE hunt_task_complete.hunt_id = 31 AND team_membership.user_id IN (SELECT users.id FROM users INNER JOIN team_membership ON users.id = team_membership.user_id INNER JOIN teams ON team_membership.team_id = teams.id WHERE teams.id IN (SELECT team_id FROM team_membership where user_id = 10) AND teams.hunt_id = 31);


// hunt_task_complete.user_id, hunt_task_complete.completed, hunt_task_complete.date_tm, hunt_task_complete.image_url, users.username, users.profileurl


//SELECT id, title FROM teams WHERE id IN (SELECT team_id FROM team_membership where user_id = 10) AND hunt_id = 31;


//SELECT users.id, users.username, users.profileurl, hunt_users.total_points FROM hunt_users INNER JOIN users ON hunt_users.user_id = users.id WHERE hunt_users.hunt_id = 52;

//SELECT hunt_task_complete.user_id, hunt_task_complete.completed, hunt_task_complete.date_tm, hunt_task_complete.image_url, users.username, users.profileurl, hunt_tasks.title, hunt_tasks.points FROM hunt_tasks INNER JOIN hunt_task_complete ON hunt_tasks.id = hunt_task_complete.task_id INNER JOIN users ON hunt_task_complete.user_id = users.id WHERE hunt_task_complete.hunt_id = 31 AND user_id IN (SELECT users.id FROM users INNER JOIN team_membership ON users.id = team_membership.user_id INNER JOIN teams ON team_membership.team_id = teams.id WHERE teams.id IN (SELECT team_id FROM team_membership where user_id = 10) AND teams.hunt_id = 31);


//SELECT hunt_task_complete.id, hunt_task_complete.hunt_id, hunt_task_complete.task_id, hunt_task_complete.user_id, hunt_task_complete.team_id, hunt_task_complete.completed, hunt_task_complete.date_tm, hunt_task_complete.image_url, users.username, users.profileurl, teams.title as team_name, teams.total_points as team_points, hunt_tasks.title as task_title, hunt_tasks.type as task_type, hunt_tasks.points as task_points FROM teams RIGHT JOIN hunt_task_complete ON teams.id = hunt_task_complete.team_id INNER JOIN users ON hunt_task_complete.user_id = users.id INNER JOIN hunt_tasks ON hunt_task_complete.task_id = hunt_tasks.id WHERE hunt_task_complete.hunt_id = $1;


