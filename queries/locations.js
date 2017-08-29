var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;


 function getGeoLocations(req, res, next) {
    var taskid = req.params.taskid;
    console.log('GET GEOLOCATIONS ENDPOINT CALLED TASKID: ', taskid);

    db.any('SELECT g.id, g.latitude, g.longitude, g.altitude, g.discoveryradius, g.modelpath, g.modelfilename, g.discovered, g.discover_dt_tm, m.title, m.image_url, m.model_url, m.xscale, m.yscale, m.zscale, m.roll, m.tilt, m.heading, m.model_uid FROM geolocations g INNER JOIN models m ON g.model_id = m.id WHERE taskid = $1', [taskid])
      .then(respondWithData(res, 'geolocations for taskid'))
      .catch(catchError(next));
 };


 function discoverGeoLocation(req, res, next) {
    db.none('UPDATE geolocations SET discovered = true WHERE id = ${id} AND taskid = ${taskid}', req.body)
      .then(postData(res, 'discovered geolocation, id: ' + req.body.id))
      .catch(catchError(next));
 };


 function addGeolocations(req, res, next) {
    var pkg = req.body;
    var cs = new pgp.helpers.ColumnSet(['taskid', 'model_id', 'latitude', 'longitude', 'discovered'], {table: 'geolocations'});
    var values = pkg;
    var query = pgp.helpers.insert(values, cs) + 'RETURNING id';

    db.many(query)
      .then(respondWithData(res, 'added geolcations for task ID: ', pkg.taskid))
      .catch(catchError(next));
 };


 module.exports = {
 	getGeoLocations: getGeoLocations,
 	discoverGeoLocation: discoverGeoLocation,
 	addGeolocations: addGeolocations

 }