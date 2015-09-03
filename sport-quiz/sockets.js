var socketio = require('socket.io'),
    util = require('util'), // used for usefull console log for exaple
    passport = require('passport'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    MongoStore = require('connect-mongo')(session),  //we will store our sessions here
    passportSocketIo = require("passport.socketio"),
    common = require('./config/common'); //our configuration will be here


module.exports.listen = function(app) { //wigure out module.exports !!!

  io = socketio(app) //it is attached to our server
  //With Socket.io >= 1.0
  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,       // the same middleware you registrer in express
    key:          common.config.session_key,       // the name of the cookie where express/connect stores its session_id
    secret:       common.config.session_secret,    // the session_secret to parse the cookie
    store:        new MongoStore({ mongooseConnection: mongoose.connection }),        // we NEED to use a sessionstore. no memorystore please
    success:      onAuthorizeSuccess,  // *optional* callback on success - read more below
    fail:         onAuthorizeFail,     // *optional* callback on fail/error - read more below
  }));

  var questionModel = require('./models/questions'),
      allQ,
      questions,
      query;

  //TODO - this should not be here at all! This must be ensured on question add/update methods!
  //questionModel.syncRandom(function (err, result) {
  //  console.log("SINHRONIZACIJA RADNOM TACAKA: "+result.updated);
  //});

  //now get random 5 questions by r point
  query= questionModel.findRandom().limit(5).exec(function(err, allQuestions){
      questions = allQuestions;
      console.log(questions);
  });

  //central objects games is current list of active games
  var players = {}; //list of player sockets and created player objects
  var games =  {};
  var lastRoom = 'default';

  var currentQuestions = Array(); //must be room related!
  var totalQuestionsInGame = common.config.room_rounds; //ensure no repetition of questions!
  var counter = 0;


  function onAuthorizeSuccess(data, accept){
    console.log('successful connection to socket.io');
    accept(null, true);
  }

  function onAuthorizeFail(data, message, error, accept){
    if(error)
      throw new Error(message);
    console.log('failed connection to socket.io:', message);

    // We use this callback to log all of our failed connections.
    accept(null, false);

    //log this in file ?
  }


  //when new socket is connected
  io.on('connection', function(socket) {
    console.log("Connection event is present as well...: "+socket.request.user.username);
    //in feture here we need to run session checks and other stuff before the join

    //to all people count and list connected players
    io.emit('playersConnected', getObjectSize(players));
    io.emit('playersList', getFormatedPlayers());

    //when client says he wants to play
    socket.on('joinGame', function() {
      //we register him as player
      addUser(socket, socket.request.user.username);

      //then to all pepople wh send new list of players
      io.emit('playersList', getFormatedPlayers());

      //emit new numebr of players
      io.emit('playersConnected',getObjectSize(players));

      //figure out in which room this player bellongs
      socket.join(lastRoom); //note that lastRoom will have different value as global variable

      //eventually we try to start the game with that single socket
      tryToStartGame(socket);
    });

    //TODO loging answers somewhere and calculate score better also pull score increase from cron
    socket.on('answer', function(answer, room){
      //get username from socket
      var username = socket.request.user.username;
      //check is presented question in that room
      var question = currentQuestions[room];
      var a_msg = username+" answered "+answer+" in room "+room+ "on question: "+question.title;
      var a_status = ''; //holder for is answer correct or wrong

      if (question.answer===answer){
        a_status = "THIS IS A CORRECT ANSWER";

        var score = players[socket.id]['score'];

        if (typeof score === 'undefined'){
          score = 0;
        }

        players[socket.id]['score']=score+5; //give 5 points for each correct answer
        socket.emit('myScore',players[socket.id]['score']);
        console.log(username+" score: "+players[socket.id]["score"]);
      }
      else{
        a_status = "SORRY, YOU ARE WRONG!";
      }

      console.log(a_msg+" :: "+a_status);

      //let this user also know what he did
      socket.emit('answerProcessed', a_status);
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
    var player = new Object();
    player["username"] = username;
    player["io"] = user; //socket object -- se do we rally need it here
    player["score"] = 0;
    players[user.id] = player;
    console.log('user - added: '+username);
  }

  //remove this user from player list and from player names
  //TODO remove it from active game, and then cancel the game btw!
  function removeUser(user){
    delete players[user.id]; //remove id from the list
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
    var counter = 0;

    console.log("Size of room "+lastRoom+" is: "+getObjectSize(clients));

    //we are checking size of last room, in case that we have 2 differen dudes, game can start
    if (getObjectSize(clients) == 2) {
      //ensure here a random question TODO
      var question = questions[Math.floor(Math.random() * questions.length)];

      //add this question as active in current room
      currentQuestions[lastRoom] = question;

      //we just make a basic game array, should be more sophisticated in theory and we add FIFO players TODO numbers to be in config
      var p1 = players[getFromObject(clients, 0)]; //so this is basiclly socket located in our players array
      var p2 = players[getFromObject(clients, 1)]; //same as above

      games[lastRoom]= {
        'leftPlayer': p1.username, //note that we are sending only username
        'rightPlayer': p2.username, //and not an full object, but maybe we should ?
        'question': question.title,
        'a1': question.a1,
        'a2': question.a2,
        'a3': question.a3,
        'a4': question.a4,
        'roomName': lastRoom
      };

      console.log("We can start the game... in room: "+lastRoom);

      //let all the people in that room know that game can start, and send game details as well
      io.to(lastRoom).emit('game', games[lastRoom]);

      //client needs to be aware when game is ended
      var gameToCancel = lastRoom; //this variable needs to be here as JS cloasure

      //IMPORTANT: this timmer with value above is crucial in game ending
      var roomInterval = setInterval(function(){

        counter++; //increase round count on each timeout

        if (counter<=totalQuestionsInGame){
          //run new round by ensuring the same players and new question
          //ensure here a random question
          var newQuestion = questions[Math.floor(Math.random() * questions.length)];

          //add this question as active in current room
          currentQuestions[gameToCancel] = newQuestion;

          //we just make a basic game array, should be more sophisticated
          games[gameToCancel]['questionRow'] = newQuestion;
          games[gameToCancel]['round'] = counter;

          //finally dispatch new round
          io.to(gameToCancel).emit('newRound', games[gameToCancel]);
          console.log("pocinje nova runda... runda broj: "+counter);
        }
        else{
          clearInterval(roomInterval);

          //calculate scores
          //we emit event only to correct room!
          console.log("Canceling game : "+gameToCancel);

          var msg = "Tie game";

          var clients = io.sockets.adapter.rooms[gameToCancel];

          //console.log("Detalji svih igraca: "+util.inspect(players, false, null));

          //here we need to calculate score
          var winner = players[socket.id];

          for (key in clients){

            console.log("KEY: "+key+" Player: "+players[key].username+" Score: "+players[key]['score']);

            if (winner.score < players[key]['score']){
              winner = players[key];
            }

          }

          //TODO btw we should not have a tie game ?
          msg = "WINNER IS: "+winner.username+" And his score is: "+winner.score;

          //save game into database
          console.log("Detalji igrice: "+util.inspect(games[gameToCancel], false, null));

          //cancel game figure out the scores and determinate the winner
          io.to(gameToCancel).emit('gameEnded', msg);

        }

      }, 10000); //after 10 seconds

      //reset the room name, so next time when this function is called in second room
      //we will have something different
      lastRoom = 'game'+new Date().getTime();
    }

    //we have less then 2 players, then we need to tell him,
    //that he need to wait for another player
    if (getObjectSize(clients) < common.config.players_number){
      console.log("Less then 2 players");
      socket.emit('waiting', 'Waiting for another user to join the game');
    }

  }

  //basicaly this just return list of players to the client TODO check is this the most optimal solution
  function getFormatedPlayers(){
    var data ={};

    for (p in players){
      //console.log("PLEJER - "+util.inspect(p, false, null));
      data[p]=players[p].username;
    }
    return data;
  }

  //hellper function to check size of object
  function getObjectSize(obj) {
    var size = 0, key; // get the size data

    for (key in obj) { // check the okeys in the object
      if (obj.hasOwnProperty(key)) size++; //increase the size
    }
    return size; // return the size of the object
  }

  //helper gunction to get element on certain index in object
  function getFromObject(obj, index){
    return Object.keys(obj)[index];
  }

  return io; //so it is exposed to other modules as well
}
