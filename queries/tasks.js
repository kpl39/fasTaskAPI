var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;



 function getTasks(req, res, next) {
    console.log('ROUTE CALLED;')
    db.any('SELECT tasks.id, tasks.title, tasks.description, tasks.imageurl, tasks.active, tasks.starttime, tasks.entrydate, tasks.timed, tasks.locationbased, vendors.id vendor_id, vendors.vendor_nm, vendors.logourl vendor_logo, vendors.website, promotions.prize, promotions.id promotion_id FROM vendors INNER JOIN promotions ON vendors.id = promotions.vendorid INNER JOIN tasks ON promotions.taskid = tasks.id')
    .then(respondWithData(res, "Task Data"))
    .catch(catchError)
 };

 function tasksByDistance(req, res, next) {
    console.log("TASKS BY DISTANCE", req.body);
    var pkg = req.body;
    //WHERE acos(sin(radians(${latitude})) *sin(radians(geolocations.latitude)) + cos(radians(${latitude})) *cos(radians(geolocations.latitude))*cos(radians(geolocations.longitude)- radians(${longitude}))) * 3959 < ${radius}
    // db.any('Select id, latitude, longitude, acos(sin(radians( ${latitude} )) *sin(radians(latitude)) + cos(radians(${latitude})) *cos(radians(latitude))*cos(radians(longitude)- radians(${longitude}))) * 3959 As D From geolocations Where acos(sin(radians( ${latitude} )) *sin(radians(latitude)) + cos(radians(${latitude})) *cos(radians(latitude))*cos(radians(longitude)- radians(${longitude}))) * 3959 < ${radius}', pkg)
    db.any('SELECT geolocations.id geoid, geolocations.latitude, geolocations.longitude, acos(sin(radians(${latitude})) *sin(radians(geolocations.latitude)) + cos(radians(${latitude})) *cos(radians(geolocations.latitude))*cos(radians(geolocations.longitude)- radians(${longitude}))) * 3959 AS distance, tasks.id, tasks.title, tasks.description, tasks.imageurl, tasks.active, tasks.starttime, tasks.entrydate, tasks.timed, tasks.locationbased, tasks.national, tasks.endtime, tasks.ended, vendors.id vendor_id, vendors.vendor_nm, vendors.logourl vendor_logo, vendors.website, promotions.prize, promotions.id promotion_id FROM vendors INNER JOIN promotions ON vendors.id = promotions.vendorid INNER JOIN tasks ON promotions.taskid = tasks.id INNER JOIN geolocations ON tasks.id = geolocations.taskid', pkg)
    .then(respondWithData(res, "Task Data By Distance"))
    .catch(catchError)
 };


 function taskDetail(req, res, next) {
    var taskID = parseInt(req.params.id);
    console.log('TASK ID = ', taskID);
    db.one('SELECT * FROM tasks WHERE id = $1', [taskID])
      .then(respondWithData(res, "task detail"))
      .catch(catchError)
 };


  // app.get('/api/posts/:taskid', function(req, res, next) {
  //   var taskID = parseInt(req.params.taskid);
  //   console.log('GET POSTS TASK ID = ', taskID);
  //   db.any('SELECT * FROM posts WHERE taskid = $1', [taskID])
  //     .then(respondWithData(res, "posts data"))
  //     .catch(catchError)
  // })

 function getPosts(req, res, next) {
    var taskID = parseInt(req.params.taskid);

    db.any('SELECT posts.id, posts.postdate, posts.taskid, posts.userid, posts.username, posts.imageurl, posts.avatarurl, count(distinct likes.id) AS postlikes, count(distinct comments.id) AS commentcount FROM posts  INNER JOIN likes ON likes.postid = posts.id INNER JOIN comments ON posts.id = comments.postid WHERE posts.taskid = $1 GROUP BY posts.id;', [taskID])
      .then(respondWithData(res, "posts data"))
      .catch(catchError)
 };


 function getUserPosts(req, res, next) {
    var userid = parseInt(req.params.userid);

    db.any('SELECT posts.id, posts.postdate, posts.taskid, posts.userid, posts.username, posts.imageurl, posts.avatarurl, count(distinct likes.id) AS postlikes, count(distinct comments.id) AS commentcount FROM posts  INNER JOIN likes ON likes.postid = posts.id INNER JOIN comments ON posts.id = comments.postid WHERE posts.userid = $1 GROUP BY posts.id;', [userid])
      .then(respondWithData(res, "posts data"))
      .catch(catchError)
 };


 function getPostDetail(req, res, next) {
    var postID = parseInt(req.params.postid);

    db.one('SELECT * FROM posts where id = $1', [postID])
      .then(respondWithData(res, 'post detail data'))
      .catch(catchError)
 };


 function addTask(req, res, next) {
    var pkg = req.body;

    db.one('INSERT INTO tasks(TITLE, DESCRIPTION, IMAGEURL, ACTIVE, STARTTIME, PRIZE, ENTRYDATE, TIMED, LOCATIONBASED, WIKITUDE_FILE, ENDTIME, ENDED, NATIONAL, VENDORID) VALUES(${title}, ${description}, ${imageurl}, ${active}, ${starttime}, ${prize}, ${entrydate}, ${timed}, ${locationbased}, ${wikitude_file}, ${endtime}, ${ended}, ${national}, ${vendorid}) RETURNING id', pkg)
      .then(respondWithData(res, 'added task'))
      .catch(catchError)
 };



 function completeTask(req, res, next) {
    db.one('INSERT INTO posts(postdate, taskid, userid, username, imageurl, avatarurl, upvotes) values(${date}, ${taskid}, (SELECT id FROM users WHERE userid = ${userid}), ${username}, ${imageurl}, ${avatarurl}, ${upvotes}) returning *', req.body)
        .then(respondWithData(res, 'task completed'))
        .catch(catchError(next));
 };

 function addWinner(req, res, next) {
    db.none('INSERT into winners (userid, promotionid, win_dt_tm) values((SELECT id FROM users WHERE userid = ${userid}), (SELECT id FROM promotions WHERE taskid = ${taskid}), ${win_dt_tm})', req.body)
        .then(postData(res, 'added winner'))
        .catch(catchError(next));
 };



module.exports = {
  getTasks: getTasks,
  tasksByDistance: tasksByDistance,
  taskDetail: taskDetail,
  getPosts: getPosts,
  getUserPosts: getUserPosts,
  getPostDetail: getPostDetail,
  addTask: addTask,
  completeTask: completeTask,
  addWinner: addWinner
};



