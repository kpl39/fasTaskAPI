var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;



 function submitHunt(req, res, next) {
 
      db.one('INSERT INTO hunts(title, description, date_tm, team, duration, active, ended, prize) VALUES(${title}, ${description}, ${date_tm}, ${team}, ${duration}, ${active}, ${ended}, ${prize}) returning *', req.body)
        .then(respondWithData(res, 'added hunt'))
        .catch(catchError(next));
  };


 function submitHuntTasks(req, res, next) {

    console.log("SUBMIT HUNT TASKS", req.body);

    var cs = new pgp.helpers.ColumnSet(['hunt_id', 'title', 'hint', 'latitude', 'longitude', 'model_id', 'type', 'points'], {table: 'hunt_tasks'});

    var values = req.body; 

    var query = pgp.helpers.insert(values, cs) + 'RETURNING id';

    db.many(query)
      .then(respondWithData(res, 'added hunt tasks'))
      .catch(catchError(next));
 
      // db.none('INSERT INTO hunt_tasks(hunt_id, title, hint, latitude, longitude, model_id) VALUES $1', Inserts('${hunt_id}, ${title}, ${hint}, ${latitude}, ${longitude}, ${model_id}', req.body))
      //   .then(postData(res, 'added hunt tasks'))
      //   .catch(catchError(next));
  };

  function getHuntTasks(req, res, next) {
    var huntid = req.params.huntid; 
    var userid = req.params.userid;
    // db.any('SELECT hunt_tasks.id, hunt_tasks.title, hunt_tasks.hint, hunt_tasks.type, hunt_tasks.latitude, hunt_tasks.longitude, hunt_tasks.model_id, models.image_url FROM hunt_tasks INNER JOIN models ON hunt_tasks.model_id = models.id WHERE hunt_id = $1', [huntid])
    db.any('SELECT hunt_task_complete.completed, hunt_task_complete.image_url as picture, hunt_task_complete.date_tm, hunt_tasks.id, hunt_tasks.title, hunt_tasks.hint, hunt_tasks.type, hunt_tasks.latitude, hunt_tasks.longitude, hunt_tasks.model_id, hunt_tasks.points, models.image_url FROM hunt_task_complete RIGHT JOIN hunt_tasks ON hunt_task_complete.task_id = hunt_tasks.id INNER JOIN models ON hunt_tasks.model_id = models.id WHERE hunt_tasks.hunt_id = $1 AND hunt_task_complete.user_id = $2', [huntid, userid])

      .then(respondWithData(res, 'hunt tasks for id: ', huntid))
      .catch(catchError(next));
  };

 function getHuntTasksByHunt(req, res, next) {
    var huntid = req.params.huntid;

    db.any('SELECT * FROM hunt_tasks WHERE hunt_id = $1', [huntid])
      .then(respondWithData(res, 'hunt tasks for hunt_id: ', huntid))
      .catch(catchError(next));
  };

 function sumbitHuntUsers(req, res, next) {
    console.log("HUNT USERS", req.body);

    var cs = new pgp.helpers.ColumnSet(['hunt_id', 'user_id', 'admin', 'accepted', 'declined', 'total_points'], {table: 'hunt_users'});

    var values = req.body; 

    var query = pgp.helpers.insert(values, cs) + 'RETURNING id';

    db.many(query)
      .then(respondWithData(res, 'added hunt users'))
      .catch(catchError(next));
  };

 function getUserHunts(req, res, next) {

    var userid = req.params.userid;

    db.any('SELECT  hunts.id as huntid, hunts.title, hunts.description, hunts.date_tm, hunts.team, hunts.duration, hunts.active, hunts.ended, users.id as adminid, users.userid, users.username, users.email, users.profileurl FROM users INNER JOIN hunt_users ON users.id = hunt_users.user_id INNER JOIN hunts ON hunt_users.hunt_id = hunts.id WHERE hunt_users.hunt_id IN (SELECT hunts.id from hunts INNER JOIN hunt_users ON hunt_users.hunt_id = hunts.id WHERE hunt_users.user_id = $1) AND hunt_users.admin = true', userid)
        .then(respondWithData(res, 'here are the scavenger hunts'))
        .catch(catchError(next));
  };

 function getHuntAccepts(req, res, next) {
    var userid = req.params.userid; 

    db.any('SELECT hunt_id, accepted, declined from hunt_users WHERE user_id = $1', userid)
       .then(respondWithData(res, 'here are the scavenger hunts'))
        .catch(catchError(next));
  };

 function acceptHunt(req, res, next) {
    db.none('UPDATE hunt_users SET(declined, accepted) = (false, true) WHERE user_id = ${userid} AND hunt_id = ${hunt_id}', req.body)
      .then(postData(res, 'accepted hunt'))
      .catch(catchError)
  };

 function declineHunt(req, res, next) {
    db.none('UPDATE hunt_users SET(declined, accepted) = (true, false) WHERE user_id = ${userid} AND hunt_id = ${hunt_id}', req.body)
      .then(postData(res, 'declined hunt'))
      .catch(catchError)
  };


 function addComplete(req, res, next) {
    var cs = new pgp.helpers.ColumnSet(['hunt_id', 'task_id', 'user_id', 'team_id', 'completed', 'date_tm', 'image_url'], {table: 'hunt_task_complete'});
    var values = req.body; 
    var query = pgp.helpers.insert(values, cs) + 'RETURNING id, hunt_id';

    db.many(query)
      .then(respondWithData(res, 'added tasks for user'))
      .catch(catchError(next));
    // db.none('INSERT INTO hunt_task_complete(hunt_id, task_id, user_id, team_id, completed, date_tm, image_url) VALUES(${hunt_id}, ${task_id}, ${user_id}, ${team_id}, ${completed}, ${date_tm}, ${image_url})', req.body)
    //   .then(postData(res, 'add blank completed record'))
    //   .catch(catchError)
  };

 function completeHuntTask(req, res, next) {
    console.log("COMPLETE HUNT TASK", req.body);
    db.none('UPDATE hunt_task_complete SET (completed, image_url, date_tm) = (true, ${image_url}, ${date_tm}) WHERE task_id = ${task_id} AND user_id = ${user_id}', req.body)
      .then(postData(res, 'update complete task record'))
      .catch(catchError)
  };

 function addTeamsToHunt(req, res, next) {
    var cs = new pgp.helpers.ColumnSet(['title', 'hunt_id', 'total_points'], {table: 'teams'});
    var values = req.body; 
    var query = pgp.helpers.insert(values, cs) + 'RETURNING id, title';

    db.many(query)
      .then(respondWithData(res, 'added teams to hunt'))
      .catch(catchError(next));
  };

 function addUsersToTeams(req, res, next) {
    var cs = new pgp.helpers.ColumnSet(['user_id', 'team_id'], {table: 'team_membership'});
    var values = req.body; 
    var query = pgp.helpers.insert(values, cs) + 'RETURNING id, user_id, team_id';

    db.many(query)
      .then(respondWithData(res, 'added users to teams'))
      .catch(catchError(next));
  };


 function getUserTeamByHunt(req, res, next) {
    var hunt_id = req.params.hunt_id;
    var user_id = req.params.user_id;

    db.one('SELECT teams.id FROM teams INNER JOIN team_membership ON team_membership.team_id = teams.id WHERE teams.hunt_id = $1 AND team_membership.user_id = $2', [hunt_id, user_id])
      .then(respondWithData(res, 'here is the team id'))
      .catch(catchError(next));
  };


 function getHuntUsers(req, res, next) {
    var hunt_id = req.params.hunt_id;

    db.any('SELECT hunt_users.accepted, hunt_users.declined, users.id, users.profileurl, users.username FROM hunt_users INNER JOIN users ON hunt_users.user_id = users.id WHERE hunt_users.hunt_id = $1', [hunt_id])
      .then(respondWithData(res, 'here is the team id'))
      .catch(catchError(next));
  };


 function getTeamUserCompletes(req, res, next) {
    var hunt_id = req.params.hunt_id;
    var user_id = req.params.user_id;


    db.any('SELECT hunt_task_complete.user_id, hunt_task_complete.completed, hunt_task_complete.date_tm, hunt_task_complete.image_url, hunt_task_complete.task_id, users.username, users.profileurl, hunt_tasks.title, hunt_tasks.points FROM hunt_tasks INNER JOIN hunt_task_complete ON hunt_tasks.id = hunt_task_complete.task_id INNER JOIN users ON hunt_task_complete.user_id = users.id WHERE hunt_task_complete.hunt_id = $1 AND user_id IN (SELECT users.id FROM users INNER JOIN team_membership ON users.id = team_membership.user_id INNER JOIN teams ON team_membership.team_id = teams.id WHERE teams.id IN (SELECT team_id FROM team_membership where user_id = $2) AND teams.hunt_id = $1)', [hunt_id, user_id])
      .then(respondWithData(res, 'all users on team for this hunt with complete or not on all tasks'))
      .catch(catchError(next));
  };

 function getUserTeam(req, res, next) {
    var hunt_id = req.params.hunt_id;
    var user_id = req.params.user_id;

    db.any('SELECT id, title FROM teams WHERE id IN (SELECT team_id FROM team_membership where user_id = $2) AND hunt_id = $1;', [hunt_id, user_id])
      .then(respondWithData(res, 'Users Team Title and ID'))
      .catch(catchError(next));
  };


 function startHunt(req, res, next) {
    var hunt_id = req.body.hunt_id; 

    db.none('UPDATE hunts SET active = coalesce(true, active) WHERE id=$1', [hunt_id])
    .then(postData(res, 'hunt: ' + hunt_id + ' is active'))
    .catch(catchError)
  };


 function endHunt(req, res, next) {
    var hunt_id = req.body.hunt_id; 

    db.none('UPDATE hunts SET ended = coalesce(true, ended), active = coalesce(false, active) WHERE id=$1', [hunt_id])
    .then(postData(res, 'hunt: ' + hunt_id + ' has ended'))
    .catch(catchError)
  };

  
 function getHuntResults(req, res, next) {
    var hunt_id = req.params.huntid;

    db.any('SELECT hunt_task_complete.id, hunt_task_complete.hunt_id, hunt_task_complete.task_id, hunt_task_complete.user_id, hunt_task_complete.team_id, hunt_task_complete.completed, hunt_task_complete.date_tm, hunt_task_complete.image_url, users.username, users.profileurl, teams.title as team_name, teams.total_points as team_points, hunt_tasks.title as task_title, hunt_tasks.type as task_type, hunt_tasks.points as task_points FROM teams RIGHT JOIN hunt_task_complete ON teams.id = hunt_task_complete.team_id INNER JOIN users ON hunt_task_complete.user_id = users.id INNER JOIN hunt_tasks ON hunt_task_complete.task_id = hunt_tasks.id WHERE hunt_task_complete.hunt_id = $1', [hunt_id])
      .then(respondWithData(res, 'Results for Hunt: ' + hunt_id))
      .catch(catchError(next));
  };


 function getHuntUserResults(req, res, next) {
    var hunt_id = req.params.huntid;

    db.any('SELECT hunt_users.total_points, users.id, users.username, users.profileurl FROM hunt_users INNER JOIN users ON hunt_users.user_id = users.id WHERE hunt_users.hunt_id = $1', [hunt_id])
      .then(respondWithData(res, 'Results for Users of Hunt: ' + hunt_id))
      .catch(catchError(next));
  };


 function teamScores(req, res, next) {
    var cs = new pgp.helpers.ColumnSet(['?id', 'total_points'], {table: 'teams'});
    var values = req.body; 
    var query = pgp.helpers.update(values, cs) + 'WHERE t.id = v.id RETURNING t.id, t.total_points';

    db.many(query)
      .then(respondWithData(res, 'compiled team points'))
      .catch(catchError(next));
  };



  function userScores(req, res, next) {
    var cs = new pgp.helpers.ColumnSet(['?hunt_id', '?user_id', 'total_points'], {table: 'hunt_users'});
    var values = req.body; 
    var query = pgp.helpers.update(values, cs) + 'WHERE t.hunt_id = v.hunt_id  AND t.user_id = v.user_id RETURNING t.id, t.total_points';

    db.many(query)
      .then(respondWithData(res, 'compiled user points'))
      .catch(catchError(next));
  };



 function getFavoriteTasks(req, res, next) {
    var userid = req.params.userid

    db.any('SELECT ft.id, ft.global, ft.owner_id, ft.title, ft.description, uf.id as fav_id from favorite_task as ft LEFT JOIN user_favorite as uf ON ft.id = uf.favorite_id WHERE ft.owner_id = $1 OR ft.global = true OR uf.user_id = $1;', [userid])
      .then(respondWithData(res, 'favorite tasks'))
      .catch(catchError(next));
  };

 function addFavoriteTask(req, res, next) {
    var pkg = req.body; 

    db.one('INSERT INTO favorite_task (global, owner_id, title, description) VALUES(${global}, ${user_id}, ${title}, ${description}) RETURNING id', pkg)
      .then(respondWithData(res, 'added favorite task'))
      .catch(catchError(next));
  };

  module.exports = {
    submitHunt: submitHunt,
    submitHuntTasks: submitHuntTasks,
    getHuntTasks: getHuntTasks,
    getHuntTasksByHunt: getHuntTasksByHunt,
    sumbitHuntUsers: sumbitHuntUsers,
    getUserHunts: getUserHunts,
    getHuntAccepts: getHuntAccepts,
    acceptHunt: acceptHunt,
    declineHunt: declineHunt,
    addComplete: addComplete,
    completeHuntTask: completeHuntTask,
    addTeamsToHunt: addTeamsToHunt,
    addUsersToTeams: addUsersToTeams,
    getUserTeamByHunt: getUserTeamByHunt,
    getHuntUsers: getHuntUsers,
    getTeamUserCompletes: getTeamUserCompletes,
    getUserTeam: getUserTeam,
    startHunt: startHunt,
    endHunt: endHunt,
    getHuntResults: getHuntResults,
    getHuntUserResults: getHuntUserResults,
    teamScores: teamScores,
    userScores: userScores,
    getFavoriteTasks: getFavoriteTasks,
    addFavoriteTask: addFavoriteTask
};




