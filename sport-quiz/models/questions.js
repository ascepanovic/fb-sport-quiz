// Question model
var mongoose = require('mongoose');
var random = require('mongoose-random');

var schema = mongoose.Schema({
  title: String,
  answer: String,
  a1: String,
  a2: String,
  a3: String,
  a4: String
})

//NOTE we need to have r on insert !
schema.plugin(random, { path: 'r' }); // by default `path` is `random`. It's used internally to store a random value on each doc.

module.exports = mongoose.model('Questions', schema);
