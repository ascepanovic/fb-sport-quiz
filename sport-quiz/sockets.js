var socketio = require('socket.io')

module.exports.listen = function(app) { //wigure out module.exports !!!

  io = socketio(app) //it is attached to our server

  var questionModel = require('./models/questions'),
      allQ,
      questions,
      query;

  //TODO - this should not be here at all! This must be ensured on question add/update methods!
  //questionModel.syncRandom(function (err, result) {
  //  console.log("SINHRONIZACIJA RADNOM TACAKA: "+result.updated);
  //});

  //now get random 5 questions by r point
  query= questionModel.findRandom().limit(3).exec(function(err, allQuestions){
      questions = allQuestions;
      console.log(questions);
    });



  //central objects games is current list of active games
  var players = {}; //list of player sockets
  var playerz = {}; //list of player objects
  var playerNames = {}, games =  {};
  var playerScore = {};
  var lastRoom = 'default';


  var currentQuestions = Array(); //must be room related!
  var totalQuestionsInGame = 5; //ensure no repetition of questions!
  var counter = 0;

  //when new socket is connected
  io.on('connection', function(socket) {
    //in feture here we need to run session checks and other stuff before the join

    //to all people count and list connected players
    io.emit('playersConnected', getObjectSize(players));
    io.emit('playersList', getFormatedPlayers());

    //when client says he wants to play
    socket.on('joinGame', function(username) {

      //we register him as player
      addUser(socket, username);

      //then to all pepople wh send new list of players
      io.emit('playersList', getFormatedPlayers());

      //emit new numebr of players
      io.emit('playersConnected',getObjectSize(players));

      //figure out in which room this player bellongs
      socket.join(lastRoom); //note that lastRoom will have different value as global variable

      //eventually we try to start the game with that single socket
      tryToStartGame(socket);

    });

    socket.on('answer', function(username, answer, room){
      console.log("Answer given: "+answer+" room"+room);

      //check is presented question in that room
      var question = currentQuestions[room];

      if (question.answer===answer){
        console.log("CORRECT ANSWER");
        winner = username; //should be socket

        var score = players[socket.id]['score'];

        if (typeof score === 'undefined'){
          score = 0;
        }

        console.log("Score var: "+score);

        players[socket.id]['score']=score+5; //give 5 points for each correct answer
        socket.emit('myScore',players[socket.id]['score']);

        socket.winner = true;
        var username = playerNames[socket.id];
        console.log("Score: "+players[socket.id]["score"]);
      }
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
    player["socketID"] = user;
    player["score"] = 0;
    playerz[user.id] = player;

    players[user.id]=user;
    playerNames[user.id]=username; //put here actual user name
    console.log('user - added: '+username);
  }

  //remove this user from player list and from player names
  //TODO remove it from active game, and then cancle the game btw!
  function removeUser(user){
    delete playerz[user.id];
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
    var counter = 0;

    console.log("Size of room "+lastRoom+" is: "+getObjectSize(clients));

    //we are checking size of last room, in case that we have 2 differen dudes, game can start
    if (getObjectSize(clients) == 2) {

      //ensure here a random question
      var question = questions[Math.floor(Math.random() * questions.length)];

      console.log(question.a1);
      console.log("ODGOVOR: "+question);

      //add this question as active in current room
      currentQuestions[lastRoom] = question;

      //we just make a basic game array, should be more sophisticated
      games['default']= {
        'leftPlayer': playerNames[getFromObject(clients, 0)], //note that we are sending only username
        'rightPlayer': playerNames[getFromObject(clients, 1)], //and not an full object
        'question': question.title,
        'a1': question.a1,
        'a2': question.a2,
        'a3': question.a3,
        'a4': question.a4,
        'roomName': lastRoom
      };

      console.log("We can start the game");

      //let all the people in that room know that game can start, and send game details as well
      io.to(lastRoom).emit('game', games['default']);


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
          games['default']['questionRow'] = newQuestion;
          games['default']['round'] = counter;

          //finally dispatch new round
          io.to(gameToCancel).emit('newRound', games['default']);
          console.log("pocinje nova runda");
        }
        else{
          clearInterval(roomInterval);

          //calculate scores
          //we emit event only to correct room!
          console.log("Canceling game : "+gameToCancel);

          var msg = "Tie game";

          var clients = io.sockets.adapter.rooms[gameToCancel];

          //here we need to calculate score!
          if (socket.winner){
            console.log('WINNN');
            msg = "WINNER IS: "+playerNames[socket.id]+" And his score is: "+players[socket.id]['score'];
          }

          for (key in clients){
            console.log("KEY"+key);
          }

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

  return io; //so it is exposed to other modules as well

}
