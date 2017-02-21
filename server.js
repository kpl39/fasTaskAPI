var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var promise = require('bluebird');
var AWS = require('aws-sdk');
var fs = require('fs');


var PORT;

// AWS.config.loadFromPath('config.json');


if (process.env.PORT) {
  PORT = process.env.PORT;
} else {
  PORT = 3000;
}


var app = express();
var server = http.createServer(app);

app.use(bodyParser.json());
app.use(express.static(__dirname));

var options = {
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
console.log("PGP", pgp)


if (process.env.DATABASE_URL) {
  connectionString = process.env.DATABASE_URL + '?ssl=true';
} else {
  connectionString = 'postgres://localhost:5432/fastask'
}

console.log("database URL", connectionString);
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


// var dbConnection = {
//   host: process.env.RDS_HOSTNAME,
//   user: process.env.RDS_USERNAME,
//   password: process.env.RDS_PASSWORD,
//   port: process.env.RDS_PORT,
//   database: process.env.RDS_DB_NAME
// }



var db = pgp(connectionString);


  var respondWithData = function(res, message) {
    // console.log('**RESPOND WITH DATA**', message, res)
    return function(data) {
      console.log('DATA', data);
      res.status(200)
      .json({
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
    res.status(200).send("it works")
  })



  app.get('/api/tasks', function(req, res, next) {
    console.log('ROUTE CALLED;')
    db.any('select * from tasks')
    .then(respondWithData(res, "Task Data"))
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
    db.any('SELECT posts.id, posts.postdate, posts.taskid, posts.userid, posts.username, posts.imageurl, posts.avatarurl, posts.upvotes, count(comments.id) FROM posts INNER JOIN comments ON posts.id = comments.postid WHERE taskid = $1 GROUP BY posts.id;', [taskID])
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

    db.none('INSERT INTO tasks(USERID, TITLE, DESCRIPTION, IMAGEURL, ACTIVE, STARTTIME, PRIZE, ENTRYDATE) VALUES($1, $2, $3, $4, $5, $6, $7, $8)', [pkg.userid, pkg.title, pkg.description, pkg.imageurl, pkg.active, pkg.fulldate, pkg.prize, pkg.currenttime])
      .then(postData(res, 'added task'))
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
    db.none('INSERT INTO affiliations(userid1, userid2, requestsent, confirmed) values(${user1}, ${user2}, ${requestsent}, ${confirmed})', req.body)
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

  app.post('/api/uploadpicture', function(req, res, next) {

    var img = req.body;
    // console.log('image', img.image);

    var buf = new Buffer(img.image.replace(/^data:image\/\w+;base64,/, ""),'base64')
    // console.log('upload picture', req.body);

    var s3 = new AWS.S3();


    // console.log("img:", img)
    var bucketName = 'fastask';
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

    var profileUrl = 'https://' + bucketName + '.s3.amazonaws.com/' +  folder + "/" + keyName;
    console.log('email:', email)
    db.none('UPDATE users SET profileurl = coalesce($1, profileurl) WHERE userid=$2', [profileUrl, keyName])
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


    db.none('INSERT INTO posts(postdate, taskid, userid, username, imageurl, avatarurl) values(${date}, ${taskid}, ${userid}, ${username}, ${imageurl}, ${avatarurl})', req.body)
        .then(postData(res, 'task completed'))
        .catch(catchError(next));
  });





  server.listen(PORT, function(){
    console.log('Server Listening on Port:' + PORT);
  })






// SELECT * FROM USERS WHERE USERID IN (SELECT USERID1 from affiliations WHERE CONFIRMED = true AND USERID1 = '100684900435655' OR USERID2 = '100684900435655') UNION SELECT * FROM USERS WHERE USERID IN (SELECT USERID2 from affiliations WHERE CONFIRMED = true AND USERID1 = '100684900435655' OR USERID2 = '100684900435655');





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








