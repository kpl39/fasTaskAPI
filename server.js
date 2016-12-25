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
    db.any('SELECT posts.id, posts.postdate, posts.taskid, posts.userid, posts.username, posts.imageurl, posts.avatarurl, posts.upvotes, count(comments.id) FROM posts INNER JOIN comments ON posts.id = comments.postid WHERE taskid = 1 GROUP BY posts.id;', [taskID])
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

  app.get('/api/checkuser/:id', function(req, res, next) {
    var userId = req.params.id;
    console.log(req.params.id);
    db.one('select exists(select 1 from users where userid = $1)', [userId])
      .then(respondWithData(res, "checked"))
      .catch(catchError)
  });


  app.post('/api/adduser', function(req, res, next){
    var userInfo = req.body;
    console.log("Add user request body", req.body)
    db.none('INSERT INTO users(userid, email, profileurl) values(${userid}, ${email}, ${profileurl})', req.body)
      .then(postData(res, 'posted data'))
      .catch(catchError)
  })

  app.get('/api/getprofile/:email', function(req, res, next) {
    var email = req.params.email;
    console.log('email', email);
    db.one('SELECT * FROM users WHERE email = $1', [email])
      .then(respondWithData(res, "profile data"))
      .catch(catchError)
  })


  app.post('/api/uploadpicture', function(req, res, next) {

    var img = req.body;

    var buf = new Buffer(img.image.replace(/^data:image\/\w+;base64,/, ""),'base64')
    // console.log('upload picture', req.body);

    var s3 = new AWS.S3();


    console.log("img:", img)
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
    db.none('UPDATE users SET profileurl = coalesce($1, profileurl) WHERE email=$2', [profileUrl, email])
      .then(postData(res, 'updated profile'))
      .catch(catchError)


  })



  server.listen(PORT, function(){
    console.log('Server Listening on Port:' + PORT);
  })




// INSERT INTO tasks(USERID, TITLE, DESCRIPTION, IMAGEURL, ACTIVE, STARTTIME, PRIZE, ENTRYDATE) VALUES(1, 'some shit', 'some other shit', '', false, '', '', '')




