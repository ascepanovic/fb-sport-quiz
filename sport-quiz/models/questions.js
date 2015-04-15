// Question model
var mongoose = require('mongoose');

var schema = mongoose.Schema({
  title: String,
  answer: String,
  a1: String,
  a2: String,
  a3: String,
  a4: String
})

module.exports = mongoose.model('Questions', schema);
