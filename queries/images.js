var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;
var AWS = require('aws-sdk');

 function uploadPicture(req, res, next) {
    var img = req.body;
    var buf = new Buffer(img.image.replace(/^data:image\/\w+;base64,/, ""),'base64')
    var s3 = new AWS.S3();
    var bucketName = 'fastaskbucket';
    var keyName = img.name;
    var folder = img.folder;
    var email = img.email;
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

    var profileUrl = 'https://s3.amazonaws.com/' + bucketName + '/' +  folder + "/" + keyName;

    db.none('UPDATE users SET profileurl = coalesce($1, profileurl) WHERE userid=$2', [profileUrl, keyName])
      .then(postData(res, 'updated profile'))
      .catch(catchError)
 };


 function uploadTaskImage(req, res, next) {

    var img = req.body;
    var buf = new Buffer(img.image.replace(/^data:image\/\w+;base64,/, ""),'base64')
    var s3 = new AWS.S3({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
    var bucketName = 'fastaskbucket';
    var keyName = img.vendorid;
    var folder = 'taskImages';
    var timestamp = new Date().getTime();
    var imageurl = 'https://s3.amazonaws.com/fastaskbucket/taskImages/' + keyName + '-' + timestamp;

    var params = {Bucket: bucketName,
                  Key: folder + '/' + keyName + '-' + timestamp,
                  Body: buf,
                  ContentEncoding: 'base64',
                  ContentType: 'image/jpeg',
                  ACL: 'public-read'};

    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully uploaded data to ", imageurl);
        res.status(200).send({data: imageurl});
      };
    });
 };


 function uploadProfileImage(req, res, next) {

    var img = req.body;
    var buf = new Buffer(img.image.replace(/^data:image\/\w+;base64,/, ""),'base64')
    var s3 = new AWS.S3({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
    var bucketName = 'fastaskbucket';
    var keyName = img.userid;
    var folder = 'profileImages';
    var timestamp = new Date().getTime();
    var imageurl = 'https://s3.amazonaws.com/' + bucketName + '/' + folder + '/' + keyName + '-' + timestamp;

    var params = {Bucket: bucketName,
                  Key: folder + '/' + keyName + '-' + timestamp,
                  Body: buf,
                  ContentEncoding: 'base64',
                  ContentType: 'image/jpeg',
                  ACL: 'public-read'};

    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully uploaded data to ", imageurl);
        
        db.one('UPDATE users SET profileurl = coalesce($1, profileurl) WHERE id=$2 returning profileurl', [imageurl, img.id])
        .then(respondWithData(res, 'updated profile image'))
        .catch(catchError)
      };
    });
 };


 function uploadProfilePic(req, res, next) {
      var profileUrl = req.body.profileurl;
      var userId = req.body.userId;

     db.none('UPDATE users SET profileurl = coalesce($1, profileurl) WHERE userid=$2', [profileUrl, userId])
      .then(postData(res, 'updated profile'))
      .catch(catchError)
 };


module.exports = {
	uploadPicture: uploadPicture,
	uploadTaskImage: uploadTaskImage,
	uploadProfileImage: uploadProfileImage,
	uploadProfilePic: uploadProfilePic
};







