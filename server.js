var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var promise = require('bluebird');

var PORT;



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

var db = pgp('postgres://localhost:5432/fastask');

server.listen(PORT, function(){
  console.log('Server Listening on Port:' + PORT);
})

  var respondWithData = function(res, message) {
    return function(data) {
      res.status(200)
      .json({
        status: 'success',
        data: data,
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



  app.get('/api/tasks/', function(req, res) {
    db.any('select * from tasks')
    .then(respondWithData(res, "Task Data"))
    .catch(catchError)
  });

