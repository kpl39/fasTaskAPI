var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;


function addLike(req, res, next) {
  db.none('INSERT INTO likes(postid, userid, date_tm, taskid) VALUES(${postid}, (SELECT id FROM users WHERE userid = ${userid}), ${date_tm}, ${taskid})', req.body)
      .then(postData(res, 'added like'))
      .catch(catchError(next));
};


 function getLikes(req, res, next) {
    var taskid = req.params.taskid;
    var userid = req.params.userid;

    db.any('SELECT * FROM likes WHERE taskid = $1 AND userid = (SELECT id FROM users WHERE userid = $2)', [taskid, userid])
        .then(respondWithData(res, 'here are the likes for userid: ' + userid + ' and taskid: ' + taskid))
        .catch(catchError(next));
 };
 

 function removeLike(req, res, next) {
    console.log("REMOVE LIKES CALLED", req.body);
    var postid = req.params.postid;
    var userid = req.params.userid;
    var taskid = req.params.taskid;

    db.none('DELETE FROM likes WHERE postid = $1 AND userid = (SELECT id FROM users WHERE userid = $2) AND taskid = $3', [postid, userid, taskid])
        .then(postData(res, 'removed like'))
        .catch(catchError(next));
 };


  module.exports = {
  	addLike: addLike,
  	getLikes: getLikes,
  	removeLike: removeLike
  };