var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    routes = require('./routes'),
    app,
    server,
    io;

//create application over express
app = express();
routes(app);

server = app.listen(3000);

//our socket io logic is in separate file
io = require('./sockets.js').listen(server)

//do here list of all questions and crud logic as well

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app; //we are exporting app to other modules
