var express = require('express'),
    path = require('path'),
    routes = require('./routes'),
    middlewares = require('./middlewares'),
    app,
    server,
    io;

//create application over express
app = express();
routes(app);

server = app.listen(3000);

//our socket io logic is in separate file
io = require('./sockets.js').listen(server)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

module.exports = app; //we are exporting app to other modules
