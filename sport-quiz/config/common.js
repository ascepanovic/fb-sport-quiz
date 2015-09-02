//this file is used as our main configuration file together with env.json
var env = require('./env.json');

module.exports = {
  //var env = "dev"; //process.env.NODE_ENV || 'development';
  config: env["dev"]
};
