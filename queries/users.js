var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;


 function getUserNames(req, res, next) {
    db.any('select username from users;')
      .then(respondWithData(res, 'usernames'))
      .catch(catchError)
 };


 function getUsers(req, res, next) {
    db.any('select * from users')
      .then(respondWithData(res, "User Data"))
      .catch(catchError)
 };


 function getUserName(req, res, next) {
    var userId = parseInt(req.params.id);

    db.one('select exists(select 1 from users where userid = $1)', [userId])
      .then(respondWithData(res, "checked"))
      .catch(catchError)
 };

 function updateUserName(req, res, next) {
    console.log('user pkg', req.body);
    db.none('UPDATE users SET username = ${username} WHERE userid = ${userid}', req.body)
      .then(postData(res, 'updated username'))
      .catch(catchError)
 };

 function checkUser(req, res, next) {
    var userId = req.params.id ;

    db.one('select exists(select 1 from users where userid = $1)', [userId])
      .then(respondWithData(res, "checked"))
      .catch(catchError)
 };


 function addUser(req, res, next){
    var userInfo = req.body;
   
    db.none('INSERT INTO users(userid, username, email, profileurl) values(${userid}, ${username}, ${email}, ${profileurl})', req.body)
      .then(postData(res, 'posted data'))
      .catch(catchError)
  };


 function getProfile(req, res, next) {
    var userid = req.params.id;
  
    db.one('SELECT * FROM users WHERE userid = $1', [userid])
      .then(respondWithData(res, "profile data"))
      .catch(catchError)
 };


 function getIdFromFacebook(req, res, next) {
    var facebookid = req.params.facebookid;

    db.one('SELECT userid from users where facebook_uid = $1', [facebookid])
      .then(respondWithData(res, "user id"))
      .catch(catchError)
 };


 function getUserWins(req, res, next) {
    var userid = req.params.userid;

    db.any('SELECT vendors.vendor_nm, vendors.logourl, promotions.prize, tasks.title FROM promotions INNER JOIN vendors ON promotions.vendorid = vendors.id INNER JOIN tasks ON promotions.taskid = tasks.id where promotions.id IN (select promotionid from winners where userid = (SELECT id FROM users WHERE userid = $1))', [userid])
        .then(respondWithData(res, 'userid: ' + userid + ' wins'))
        .catch(catchError(next));
 };
 

 function checkEmail(req, res, next) {
    var email = req.params.email;

    db.one('SELECT (SELECT id from users WHERE email = $1) as user, (SELECT id FROM vendors WHERE email = $1) as vendor', [email])
      .then(respondWithData(res, 'email vendor or user'))
      .catch(catchError(next));
 };





module.exports = {
	getUsers: getUsers,
	getUserNames: getUserNames,
	getUserName: getUserName,
	updateUserName: updateUserName,
	checkUser: checkUser,
	addUser: addUser,
	getProfile: getProfile,
	getIdFromFacebook: getIdFromFacebook,
	getUserWins: getUserWins,
	checkEmail: checkEmail
};
