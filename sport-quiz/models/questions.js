// Comment model
var mongoose = require('mongoose');

var schema = mongoose.Schema({
  title: String,
  answer: String
})

module.exports = mongoose.model('Questions', schema);
