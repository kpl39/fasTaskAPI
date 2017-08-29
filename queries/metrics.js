var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;


 function addTaskView(req, res, next) {
    let pkg = req.body;

    db.one('INSERT INTO task_views (taskid, userid, date_tm) VALUES(${taskid}, ${userid}, ${date_tm}) RETURNING id', pkg)
      .then(respondWithData(res, 'task view'))
      .catch(catchError(next));
 };


 function addTaskAttempt(req, res, next) {
    let pkg = req.body;

    db.one('INSERT INTO task_attempts (taskid, userid, date_tm) VALUES(${taskid}, ${userid}, ${date_tm}) RETURNING id', pkg)
      .then(respondWithData(res, 'task view'))
      .catch(catchError(next));
 };


 function getTaskAttempts(req, res, next) {
    let query = req.params.query;
    db.any(query)
      .then(respondWithData(res, 'task view'))
      .catch(catchError(next));
 };


 function taskQuery(req, res, next) {
    let pkg = req.body;

    db.any({
      name: pkg.name,
      text: pkg.query, 
      values: pkg.values
    })
      .then(respondWithData(res, pkg.name))
      .catch(catchError(next));
 };
  

 function geoFenceTransition(req, res, next) {
    let pkg = req.body;

    db.none('INSERT INTO geologs (log) VALUES(${log})', pkg)
      .then(postData(res, 'added geolog'))
      .catch(catchError)
 };


module.exports = {
  	addTaskView: addTaskView,
  	addTaskAttempt: addTaskAttempt,
  	getTaskAttempts: getTaskAttempts,
  	taskQuery: taskQuery,
  	geoFenceTransition: geoFenceTransition
  }