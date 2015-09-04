//account model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: String,
    password: String,
    rank: String,
    gamesPlayed: Number,
    createdAt: Date,
    updatedAt: Date,
    lastLogin: Date,
    cumulativeScore: Number
});

//custom methods can be defined like example method bellow
Account.methods.dudify = function(){
  // add some stuff to the users name
  this.username = this.username + '-dude';

  return this.username;
}

//and we will before each save of profile changes with this method do change of updatedAt attribute
Account.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();

  // change the updated_at field to current date
  this.updatedAt = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.createdAt)
    this.createdAt = currentDate;

  next();
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('accounts', Account);
