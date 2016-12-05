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


  app.post('/api/adduser', function(req, res, next){
    var userInfo = req.body;
    console.log("Add user request body", req.body)
    db.none('INSERT INTO users(userid, email) values(${userId}, ${email})', req.body)
      .then(postData(res, 'posted data'))
      .catch(catchError)
  })


  app.post('/api/uploadpicture', function(req, res, next) {
    console.log('upload picture', req.body);
    var img = req.body;
    var s3 = new AWS.S3();


    var bucketName = 'fastask';
    var keyName = img.name + '.png';
    var bodyName = img.image;
    // var bodyName = fs.createReadStream('fastask.png');


    var params = {Bucket: bucketName, Key: keyName, Body: bodyName, ACL: 'public-read'};

    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully uploaded data to " + bucketName + "/" + keyName);
      };
    });

    var urlParams = {Bucket: bucketName, Key: keyName};
    s3.getSignedUrl('getObject', urlParams, function(err, url) {
      console.log('the url of the image is', url);
      respondWithData(res, url);
    });





  })



  server.listen(PORT, function(){
    console.log('Server Listening on Port:' + PORT);
  })

