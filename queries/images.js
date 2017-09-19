var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;
var AWS = require('aws-sdk');
var easyimg = require('easyimage');
// var rekognition = new AWS.Rekognition({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, apiVersion: '2016-06-27'});

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
    let that = this;
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

    // s3.putObject(params, function(err, data) {
    s3.putObject(params, (err, data) => {
      if (err) {
          console.log(err);
      } else {
          console.log("Successfully uploaded data to ", imageurl);
          cropImage(imageurl);
          res.status(200).send({data: imageurl});
      };
    });
 };

 function getImageInfo(req, res, next) {
  let url = req.body.url;
  console.log("CALLED CROP IMAGE", url);
  easyimg.info(url)
    .then((image) => {
      console.log("IMAGE INFO", image);

      // cropImage(image)
      //   .then((croppedimmage) => {
          res.status(200).send({data: image});
        // })
      
      // easyimg.rescrop({})
      // easyimg.
    }, (err) => {
      console.log("ERROR", err);
    })
 }

 function cropImage(image) {
    return new Promise(resolve => {
      let thumbsize = 300;
      let height, width;

      if (image.width <= image.height) {
        width = thumbsize;
        height = (thumbsize / image.width) * image.height; 
      } else {
        height = thumbsize;
        width = (image.height / thumbsize) * image.width;
      }


      let tempname = image.name + image.type;
      let options = {
        src: image.path,
        dst: '../images/' + tempname,
        width: width,
        height: height,
        cropwidth: 300,
        cropheight: 300
      };

      easyimg.rescrop(options)
        .then((image) => {
          console.log("IMAGE AFTER CROP", image);
          resolve(image);
        }, (err) => {
          console.log("ERROR WITH CROP", err);
          resolve(err);
        })
    })
 }


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


 function detectImage(req, res, next) {
  var rekognition = new AWS.Rekognition({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, apiVersion: '2016-06-27', region: 'us-east-1'});
  let name = req.params.name;

  var params = {
    Image: {
     S3Object: {
      Bucket: "kpl-test-bucket", 
      Name: name
     }
    }
   };

  rekognition.detectFaces(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else     res.status(200).send({data: data});  
   })        // successful response

 }


module.exports = {
	uploadPicture: uploadPicture,
	uploadTaskImage: uploadTaskImage,
	uploadProfileImage: uploadProfileImage,
	uploadProfilePic: uploadProfilePic,
  getImageInfo: getImageInfo,
  detectImage: detectImage
};







