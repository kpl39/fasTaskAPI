var _ = require('lodash');

var authorization = require('./authorization');
var comments = require('./comments');
var friends = require('./friends');
var images = require('./images');
var likes = require('./likes');
var locations = require('./locations');
var metrics = require('./metrics');
var models = require('./models');
var scavengerHunts = require('./scavengerHunts');
var tasks = require('./tasks');
var users = require('./users');
var vendors = require('./vendors');

module.exports = _.assign({},
  authorization,
  comments,
  friends,
  images,
  likes,
  locations,
  metrics,
  models,
  scavengerHunts,
  tasks,
  users,
  vendors
);