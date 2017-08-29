var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;


 function updateCompanyProfile(req, res, next) {
    let pkg = req.body;
    //UPDATE hunt_task_complete SET (completed, image_url, date_tm) = (true, ${image_url}, ${date_tm}) WHERE task_id = ${task_id}
    db.none('UPDATE vendors SET(address, city, zip, country, phone, website) = (${address}, ${city}, ${zip}, ${country}, ${phone}, ${website}) WHERE id = ${vendorid}', pkg)
      .then(postData(res, 'added geolog'))
      .catch(catchError)
 };

 function getTasksByVendor(req, res, next) {
    let vendorid = req.params.vendorid;
   
    db.any('SELECT * FROM tasks where vendorid = $1', [vendorid])
      .then(respondWithData(res, 'tasks for vendorid: ', vendorid))
      .catch(catchError)
  };

 function getVendorInfo(req, res, next) {
    var userid = req.params.userid; 

    db.one('SELECT * FROM vendors WHERE userid = $1', [userid])
      .then(respondWithData(res, 'Vendor Info'))
      .catch(catchError(next));
 };

 function addCustomer(req, res, next) {
    var pkg = req.body;

    //INSERT INTO hunts(title, description, date_tm, team, duration, active, ended) VALUES(${title}, ${description}, ${date_tm}, ${team}, ${duration}, ${active}, ${ended}) returning *', req.body)

    db.one('INSERT INTO vendors(vendor_nm, city, state, zip, phone, email, website, first_name, last_name, userid) VALUES(${businessName}, ${city}, ${state},  ${zip}, ${phone}, ${email}, ${businessWebsite}, ${firstName}, ${lastName}, ${userid}) RETURNING id', pkg)
      .then(respondWithData(res, 'Vendor ID'))
      .catch(catchError(next));
 };


 function getModelId(req, res, next) {
    var uid = req.params.uid;

    db.one('SELECT ID from models WHERE model_uid = $1', [uid])
      .then(respondWithData(res, 'Model ID'))
      .catch(catchError(next));
 };


 function addPromotion(req, res, next) {
    var pkg = req.body; 

    db.one('INSERT INTO promotions(vendorid, taskid, prize) VALUES(${vendorid}, ${taskid}, ${prize}) RETURNING id', pkg)
      .then(respondWithData(res, 'added promotion ', pkg.taskid))
      .catch(catchError(next));
 };


  module.exports = {
  	updateCompanyProfile: updateCompanyProfile,
  	getTasksByVendor: getTasksByVendor,
  	getVendorInfo: getVendorInfo,
  	addCustomer: addCustomer,
  	getModelId: getModelId,
  	addPromotion: addPromotion
  };