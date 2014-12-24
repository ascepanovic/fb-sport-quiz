var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

//central objects games is current list of active games
var players = {}; //list of player sockets
var playerNames = {}, games =  {};
var lastRoom = 'default';

//this array acts like a holder for our questions, for sure we need db here
var questions = [
  'Kako se zove srpski bivsi fudbaler, Kezman ?',
  'Juventus FC je osnovan koje godine ?',
  'Da li Kosovo kao reprezenatacija ucestvuje na evropskom prvenstvu 2016te godine ?',
  'Koliko grama je teska fudbalska lopta ?',
  'Najveci stadion na svijetu zove se ?',
  'Iz koje zemlje je fudbalski klub Liverpul ?',
  'Koji igrac je osvojio zlatnu loptu 1987 godine?',
  'Koliko klubova ima u prvoj Crnogorskoj fudbalskoj ligi ?',
  'Jos neko glupo pitanje, sa slicnom odgovorom ?'
];

//serve here the client interface
app.get('/', function(req, res){
  res.sendFile(__dirname + '/client.html');
});

//when new socket is connected
io.on('connection', function(socket){

  //in feture here we need to run session checks and other stuff before the join


  //when client says he wants to play
  socket.on('joinGame', function(username){

    //we register him as player
    addUser(socket, username);

    //then to all pepople wh send new list of players
    io.emit('playersList', getFormatedPlayers());

    //figure out in which room this player bellongs
    socket.join(lastRoom); //note that lastRoom will have different value as global variable

    //eventually we try to start the game
    tryToStartGame(socket);

  });


  //disconect - remove players
  //TODO a lot of stuff, end game at first place, make db related stuff and so on
  socket.on('disconnect', function(){
      removeUser(socket);
  });

});



/**HELPER FUNCTIONS**/

//used to add socket and username to list of players
function addUser(user, username){
  players[user.id]=user;
  playerNames[user.id]=username; //put here actual user name
  console.log('user - added: '+username);
}

//remove this user from player list and from player names
//TODO remove it from active game, and then cancle the game btw!
function removeUser(user){
  delete players[user.id]; //remove id from the list
  delete playerNames[user.id];
  console.log('user - removed: '+user.id);
}

//this function will notfiy all players in the room
//that active game has just ended
//TODO destroy that room instance, and do other client logic.
function gameEnded(roomName){
  console.log("Canceling game in: "+roomName);
  io.to(roomName).emit('gameEnded', "Winner logic is todo ;) ");
}

//central logic and game start as well as gameplay starts here
function tryToStartGame(socket){

  var clients = io.sockets.adapter.rooms[lastRoom]; //so we have all the sockets in that room

  console.log("Size of room "+lastRoom+" is: "+getObjectSize(clients));

  //we are checking size of last room, in case that we have 2 differen dudes, game can start
  if (getObjectSize(clients) == 2){

    //ensure here a random question
    var question = questions[Math.floor(Math.random() * questions.length)];

    //we just make a basic game array, should be more sophisticated
    games['default']= {
      'leftPlayer': playerNames[getFromObject(clients, 0)], //note that we are sending only username
      'rightPlayer': playerNames[getFromObject(clients, 1)], //and not an full object
      'question': question,
      'roomName': lastRoom
    };

    console.log("We can start the game");

    //let all the people in that room know that game can start, and send game details as well
    io.to(lastRoom).emit('game', games['default']);


    //client needs to be aware when game is ended
    var gameToCancel = lastRoom; //this variable needs to be here as JS cloasure

    //IMPORTANT: this timmer with value above is crucial in game ending
    setTimeout(function(){

      //we emit event only to correct room!
      console.log("Canceling game : "+gameToCancel);
      io.to(gameToCancel).emit('gameEnded', "Winner logic is todo ;) ");

    }, 10000); //after 10 seconds

    //reset the room name, so next time when this function is called in second room
    //we will have something different
    lastRoom = 'game'+new Date().getTime();
  }

  //we have less then 2 players, then we need to tell him,
  //that he need to wait for another player
  if (getObjectSize(clients)<2){
    console.log("Less then 2 players");
    socket.emit('waiting', 'Waiting for another user to join the game');
  }

}


//basicaly this just return list of players to the client
function getFormatedPlayers(){

  return playerNames;
}

//hellper function to check size of object
function getObjectSize(obj) {
  var size = 0, key; // get the size data

  for (key in obj) { // check the okeys in the object
    if (obj.hasOwnProperty(key)) size++; // increase the size
  }
    return size; // return the size of the object
}

//helper gunction to get element on certain index in object
function getFromObject(obj, index){
  return Object.keys(obj)[index];
}

//start the server
server.listen(3000, function(){
  console.log('listening on *:3000');
});
