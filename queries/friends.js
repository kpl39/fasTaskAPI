var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;
var OAuth   = require('oauth-1.0a');

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




 function twitterFriends(req, res, next) {
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
  };




 function getFastTaskFriends(req, res, next) {
    var userid = req.params.userid;

    db.any('SELECT * FROM USERS WHERE USERID IN (SELECT USERID1 from affiliations WHERE CONFIRMED = true AND USERID1 = $1 OR USERID2 = $1) UNION SELECT * FROM USERS WHERE USERID IN (SELECT USERID2 from affiliations WHERE CONFIRMED = true AND USERID1 = $1 OR USERID2 = $1)', [userid])
      .then(respondWithData(res, "fastask friends data"))
      .catch(catchError)
 };


 function friendRequest(req, res, next) {
    console.log('friend request called', req.body);
    db.none('INSERT INTO affiliations(userid1, userid2, requestsent, confirmed, user1facebookid, user2facebookid) values(${user1}, ${user2}, ${requestsent}, ${confirmed}, ${user1facebookid}, ${user2facebookid} )', req.body)
      .then(postData(res, 'added friend request'))
      .catch(catchError)
 };


 function getFriendRequests(req, res, next) {
    var userid = req.params.userid;
   
    db.any('SELECT * FROM USERS WHERE USERID IN (SELECT USERID1 from affiliations WHERE REQUESTSENT = true AND CONFIRMED = false AND USERID2 = $1)', [userid])
      .then(respondWithData(res, "friend requests"))
      .catch(catchError)
 };


 function requestStatus(req, res, next) {
    var userid = req.params.userid;
    console.log('user id', userid);
    db.any('SELECT * FROM affiliations WHERE USERID1 = $1 OR USERID2 = $1', [userid])
      .then(respondWithData(res, "request status"))
      .catch(catchError)
 };

 function acceptRequest(req, res, next) {
    
    db.none('UPDATE affiliations SET confirmed = true WHERE userid1 = ${requestor} AND userid2 = ${requestee}', req.body)
      .then(postData(res, 'added friend request'))
      .catch(catchError)
 };



 module.exports = {
 	twitterFriends: twitterFriends,
 	getFastTaskFriends: getFastTaskFriends,
 	friendRequest: friendRequest,
 	getFriendRequests: getFriendRequests,
 	requestStatus: requestStatus,
 	acceptRequest: acceptRequest
 };



