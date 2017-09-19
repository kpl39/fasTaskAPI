var express = require('express');
// var app = require('express')();
var app = express();
// var http = require('http');
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var promise = require('bluebird');
var AWS = require('aws-sdk');
var fs = require('fs');
var cors = require('cors');
var request = require('request');
var OAuth   = require('oauth-1.0a');
var crypto  = require('crypto');
var db = require('./queries/exports');

var PORT;



if (process.env.PORT) {
  PORT = process.env.PORT;
} else {
  PORT = 3000;
}

var corsOptions = {
  origin: 'https://s3.amazonaws.com/'
}

console.log("after changes")
// var app = express();
// var server = http.createServer(app);

app.use(bodyParser.json({limit: '50mb'}));
app.use(express.static(__dirname));

app.use(cors())

var io = require('socket.io')(http);
// io.set("origins = *");
// console.log('IO', io); 

io.on('connection', (socket) => {

  console.log('User Connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  })

  socket.on('add-message', (message) => {
    io.emit('message', {type: 'new-message', text: message});
  });

});

// ********** AUTHORIZATION ***************** // 
app.post('/api/captcha', db.captcha); 


// ********** COMMENTS ***************** // 
app.get('/api/comments/:postid', db.getComments); 
app.post('/api/addcomment', db.addComment);
app.delete('/api/deletecomment/:id', db.deleteComment);


// ********** FRIENDS ***************** // 
app.get('/api/twitterfriends/:twitterid', db.twitterFriends);
app.get('/api/getfastaskfriends/:userid', db.getFastTaskFriends);
app.post('/api/friendrequest', db.friendRequest);
app.get('/api/getfriendrequests/:userid', db.getFriendRequests);
app.get('/api/requeststatus/:userid', db.requestStatus);
app.put('/api/acceptrequest', db.acceptRequest);


// ********** IMAGES ***************** // 
app.post('/api/uploadpicture', db.uploadPicture);
app.post('/api/uploadtaskimage', db.uploadTaskImage);
app.post('/api/uploadprofileimage', db.uploadProfileImage);
app.put('/api/updateprofilepic', db.uploadProfilePic);
app.post('/api/cropthumbnail', db.getImageInfo);
app.get('/api/detectimage/:name', db.detectImage)

// ********** LIKES ***************** // 
app.post('/api/addlike', db.addLike);
app.get('/api/getlikes/:taskid/:userid', db.getLikes);
app.delete('/api/removelike/:postid/:userid/:taskid', db.removeLike);


// ********** LOCATIONS ***************** // 
app.get('/api/geolocations/:taskid', cors(), db.getGeoLocations);
app.put('/api/geolocations', db.discoverGeoLocation);
app.post('/api/addgeolocations', db.addGeolocations);


// ********** METRICS ***************** // 
app.post('/api/addtaskview', db.addTaskView);
app.post('/api/addtaskattempt', db.addTaskAttempt); 
app.get('/api/gettaskattempts/:query', db.getTaskAttempts);
app.post('/api/taskquery', db.taskQuery);
app.post('/api/geofencetransition', db.geoFenceTransition);


// ********** MODELS ***************** // 
app.get('/api/getmodels', db.getModels); 
app.get('/api/getmodel/:modelid', db.getModel);
app.get('/api/getmodelid/:modeluid', db.getModelId);


// ********** SCAVENGER HUNTS ***************** // 
app.post('/api/submithunt', db.submitHunt);
app.post('/api/submithunttasks', db.submitHuntTasks);
app.get('/api/gethunttasks/:huntid/:userid', db.getHuntTasks);
app.get('/api/gethunttasksbyhunt/:huntid', db.getHuntTasksByHunt);
app.post('/api/submithuntusers', db.sumbitHuntUsers);
app.get('/api/getuserhunts/:userid', db.getUserHunts);
app.get('/api/gethuntaccepts/:userid', db.getHuntAccepts);
app.put('/api/accepthunt', db.acceptHunt);
app.put('/api/declinehunt', db.declineHunt);
app.post('/api/addcomplete', db.addComplete);
app.put('/api/completehunttask', db.completeHuntTask);
app.post('/api/addteamstohunt', db.addTeamsToHunt);
app.post('/api/adduserstoteams', db.addUsersToTeams);
app.get('/api/getuserteambyhunt/:hunt_id/:user_id', db.getUserTeamByHunt);
app.get('/api/gethuntusers/:hunt_id', db.getHuntUsers);
app.get('/api/getteamusercompletes/:hunt_id/:user_id', db.getTeamUserCompletes);
app.get('/api/getuserteam/:hunt_id/:user_id', db.getUserTeam);
app.put('/api/starthunt', db.startHunt);
app.put('/api/endhunt', db.endHunt);
app.get('/api/gethuntresults/:huntid', db.getHuntResults);
app.get('/api/gethuntuserresults/:huntid', db.getHuntUserResults);
app.post('/api/teamscores', db.teamScores);
app.post('/api/userscores', db.userScores);
app.get('/api/getfavoritetasks/:userid', db.getFavoriteTasks);
app.post('/api/addfavoritetask', db.addFavoriteTask);


// ********** TASKS ***************** // 
app.get('/api/tasks', db.getTasks);
app.post('/api/tasksbydistance', db.tasksByDistance); 
app.get('/api/taskdetail/:id', db.taskDetail); 
app.get('/api/posts/:taskid', db.getPosts);
app.get('/api/userposts/:userid', db.getUserPosts);
app.get('/api/postdetail/:postid', db.getPostDetail);
app.post('/api/addtask', db.addTask);
app.post('/api/completetask', db.completeTask);
app.post('/api/addwinner', db.addWinner);


// ********** USERS ***************** // 
app.get('/api/getusers/', db.getUserNames);
app.get('/api/users', db.getUsers);
app.get('/api/username/:id', db.getUserName);
app.put('/api/updateusername', db.updateUserName);
app.get('/api/checkuser/:id', db.checkUser);
app.post('/api/adduser', db.addUser);
app.get('/api/getprofile/:id', db.getProfile);
app.get('/api/getidfromfacebookid/:facebookid', db.getIdFromFacebook);
app.get('/api/userwins/:userid', db.getUserWins);
app.get('/api/checkemail/:email', db.checkEmail);


// ********** VENDORS***************** // 
app.put('/api/updatecompanyprofile', db.updateCompanyProfile);
app.get('/api/gettasksbyvendor/:vendorid', db.getTasksByVendor);
app.get('/api/getvendorinfo/:userid', db.getVendorInfo);
app.post('/api/addcustomer', db.addCustomer);
app.get('/api/getmodelid/:uid', db.getModelId);
app.post('/api/addpromotion', db.addPromotion);


// server.listen(PORT, function(){
//     console.log('Server Listening on Port:' + PORT);
// })

http.listen(PORT, function(){
    console.log('Server Listening on Port:' + PORT);
})




