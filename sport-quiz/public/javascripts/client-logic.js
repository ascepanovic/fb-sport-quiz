$( document ).ready(function() {


var socket = io();
var roomName = "sranje";

//for countdown
function counter(counter){

  setInterval(function() {
    counter--;
    if (counter >= 0) {
      $("#countdown").show();
      span = document.getElementById("countdown");
      span.innerHTML = "<h1>Hurry man, time left: "+counter+"</h1>";
    }
    // Display 'counter' wherever you want to display it.
    if (counter === 0) {
      //alert('this is where it happens');
      clearInterval(counter);
    }

  }, 1000);
}

var username = $("#name").val();


//when join btn is clicked
$("#btn").click(function(){

  var username = $("#name").val();

  if (username.length<2){
    alert('Please! At least 2 letters');
  }
  else{
    socket.emit('joinGame', username); //send to server joinGame
    console.log('game joined...');
  }

});

//my personal score is updated
socket.on('myScore', function(data){

  //alert("Your current score is: "+data);
  $("#myScore").html("Score: "+data);

});


//when answer is submited
$("#answerBtn").click(function(){
  var answer = $("#answer").val();
  $("#answer").prop('disabled', true);
  $("#answerBtn").prop('disabled', true);

  if (answer.length<1){
    alert("Please type something");
  }
  else{
    console.log("SOBA:"+roomName);
    socket.emit('answer', username, answer, roomName);
  }

});

//server send to us game event so = game starts
socket.on('game', function(data){
  console.log('Game stars, game data: '+data);
  $("#waiting").hide();
  $("#answers").show();

  $("#gameInfo").html("Game started: "+data.leftPlayer+" vs "+data.rightPlayer+" in room "+data.roomName+"<br /><br />");
  $("#game").html("Question: "+data.question);
  roomName = data.roomName;
  //we need here more stuff... inputs or predfined answers or what ever
  //so the client can display actual game related stuff,
  //and user can send unswer back to server
  counter(10); //not really good but ok for now
});

//current game is still active, now only we have new round/question
socket.on('newRound', function(data){
  console.log("New round: "+data);
  $("#game").html("New round ("+data.round+"): "+data.question);

  //enable input
  $("#answer").val("");
  $("#answer").prop('disabled', false);
  $("#answerBtn").prop('disabled', false);

  counter(10);
});

//server is telling us that game has just ended
socket.on('gameEnded', function(winner){
  //alert('PRC');
  $("#game").html("<h1 style='color:red'>"+winner+"</h1>"); //display the winner
  $("#waiting").hide();
  $("#countdown").hide(); //hide counter
});

//server tell us that this client is on waiting list
socket.on('waiting', function(data){
  $("#waiting").show();
  //$("#game").hide();s
  //$("#countdown").hide();
});

socket.on('playersConnected',function(playersConnected) {
  $("#playersConnected").html(playersConnected);
});


//populate list of all the players, do we need this ?
socket.on('playersList', function(players){
  console.log(players);
  $("#players").empty(); //reset
  for (var name in players){
    $("#players").append("<li>"+players[name]+"</li>");
  }
});


console.log( "ready!" );
});
