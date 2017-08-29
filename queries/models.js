var db = require('./connection');
var helpers = require('./queryHelpers');
var respondWithData = helpers.respondWithData;
var catchError = helpers.catchError;
var postData = helpers.postData;


 function getModels(req, res, next) {

    db.any('SELECT * FROM models')
        .then(respondWithData(res, 'here are the models'))
        .catch(catchError(next));
 };


 function getModel(req, res, next) {
    var modelid = req.params.modelid;

    db.one('SELECT * FROM models where id = $1', [modelid])
      .then(respondWithData(res, 'heres the model for id: ' + modelid))
      .catch(catchError(next));
 };


 function getModelId(req, res, next) {
    var modeluid = req.params.modeluid;

    db.one('SELECT id FROM models where model_uid = $1', [modeluid])
      .then(respondWithData(res, 'model id for uid: ' + modeluid))
      .catch(catchError(next));
  };


module.exports = {
	getModels: getModels,
	getModel: getModel,
	getModelId: getModelId
}