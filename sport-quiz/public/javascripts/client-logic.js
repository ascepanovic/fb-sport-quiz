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

//used to build pre-defined answers based on input data
function buildAnswers(data){

  $("#answers").html(""); //clear previous values

  for (i=1; i<=4; i++){
    var btn = $('<button/>', {
       text: data['a'+i], //set text 1 to 10
       id: 'btn_'+i,
       class: 'btnA',
       value: data['a'+i]
   });

   $("#answers").append(btn);
  }
}

//this is how we get dynamicly created values
//and sending answers to server at the same time
$('body').on("click", ".btnA", function (){
  var btn_id = $(this).attr('id');
  var a = $(btn_id).attr("value"); //get the value of clicked btn - this will never work on newly created elements !
  //console.log("VREDNOST: "+a);
  //alert("Odgovor: "+btn_id+" Value: "+$(this).val());
  socket.emit('answer', username, $(this).val(), roomName);

  $("#answers").html("Vas odgovor je poslat");
});


//when join btn is clicked
$("#btn").click(function(){

  var username = $("#name").val();

  if (username.length < 2) {
    alert('Please! At least 2 letters');
  } else {
    socket.emit('joinGame', username); //send to server joinGame
    console.log('game joined...');
  }

});

//my personal score is updated
socket.on('myScore', function(data){

  //alert("Your current score is: "+data);
  $("#myScore").html("Score: "+data);

});


//DEPERCATED: when answer is submited - as input
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

//predefined answer submited
$(".btnA").click(function(){
  alert("KLIKNUO");
  var answer = $(this).attr("value"); //get the value of clicked btn

  alert(answer);
  socket.emit('answer', username, answer, roomName);
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

  buildAnswers(data);

  counter(10); //not really good but ok for now
});

//current game is still active, now only we have new round/question
socket.on('newRound', function(data){
  console.log("New round: "+data);
  $("#game").html("New round ("+data.round+"): "+data.questionRow.title);

  //enable input
  $("#answer").val("");
  $("#answer").prop('disabled', false);
  $("#answerBtn").prop('disabled', false);

  buildAnswers(data.questionRow);

  //TODO ensure that counter is correct and synced in all clients!!!
  counter(10);
});

//server is telling us that game has just ended
socket.on('gameEnded', function(winner){
  //alert('PRC');
  $("#game").html("<h1 style='color:red'>"+winner+"</h1>"); //display the winner
  $("#waiting").hide();
  $("#countdown").hide(); //hide counter - will not work until counter is cleaned ?

  //reload the page again after 4 seconds
  setTimeout(function(){
    window.location.reload(false);
  }, 4000);
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
