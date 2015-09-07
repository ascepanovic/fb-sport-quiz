//account model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Game = new Schema({
    roomName: String,
    description: String,
    gameType: String,
    startedAt: Date,
    endedAt: Date,
    duration: Number,
    status: Number,
    questions: [{type: mongoose.Schema.Types.ObjectId, ref: 'Questions'}],
    users: [{type: mongoose.Schema.Types.ObjectId, ref: 'Accounts'}]
});

module.exports = mongoose.model('games', Game);
