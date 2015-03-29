var express = require('express'),
    mongoose = require('mongoose'),
    path = require('path'),
    routes = require('./routes'),
    middlewares = require('./middlewares'),
    app,
    server,
    io;



mongoose.connect('mongodb://localhost:27017/quiz_db', function (error, db) {
  mongoose.set('debug', true);
  //create application over express
  app = express();

  // DO NOT CHANGE ORDER OF LOADING!! FIRST LOAD MIDDLEWARE, THEN ROUTES
  middlewares(app);
  routes(app);

  server = app.listen(3000);

  //our socket io logic is in separate file
  io = require('./sockets.js').listen(server);

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');
});
