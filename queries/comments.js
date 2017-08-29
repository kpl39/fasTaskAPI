var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;  



 function getComments(req, res, next) {
    var postID = parseInt(req.params.postid);
    
    db.any('SELECT * FROM comments where postid = $1', [postID])
      .then(respondWithData(res, 'comments data'))
      .catch(catchError)
 };

 function addComment(req, res, next) {
    var pkg = req.body;
   
    db.none('INSERT INTO comments(POSTID, USERID, USERNAME, COMMENT, AVATARURL) VALUES(${postid}, ${userid}, ${username}, ${comment}, ${profileurl})', pkg)
      .then(postData(res, 'added comment'))
      .catch(catchError)
 };

 function deleteComment(req, res, next) {
    var commentId = parseInt(req.params.id);

    db.none('DELETE FROM comments WHERE id = $1', [commentId])
      .then(postData(res, 'deleted comment'))
      .catch(catchError)
 };


module.exports = {
	getComments: getComments,
	addComment: addComment,
	deleteComment: deleteComment
};