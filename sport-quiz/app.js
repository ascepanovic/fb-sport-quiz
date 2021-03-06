var express = require('express'),
    mongoose = require('mongoose'),
    path = require('path'),
    routes = require('./routes'),
    middlewares = require('./middlewares'),
    app,
    server,
    io;

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var common = require('./config/common'); //our configuration will be here

// passport config
var Account = require('./models/account');
      passport.use(new LocalStrategy(Account.authenticate()));
      passport.serializeUser(Account.serializeUser());
      passport.deserializeUser(Account.deserializeUser());

//parameters must be in config!
mongoose.connect(common.config.mongo_string, function (error, db) {
  mongoose.set('debug', common.config.mongoose_debug);
  //create application over express
  app = express();

  // DO NOT CHANGE ORDER OF LOADING!! FIRST LOAD MIDDLEWARE, THEN ROUTES
  middlewares(app);
  routes(app);

  server = app.listen(common.config.server_port);

  //our socket io logic is in separate file
  io = require('./sockets.js').listen(server);

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

});
