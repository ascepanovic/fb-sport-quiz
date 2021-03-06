var passport = require('passport');
var Account = require('../models/account');

//will hanlde verry basic login and registration of users
//main question is should this part be in node at all
//also we need to connect authorized user to socket right away!

module.exports = function (app) {
  app.get('/users', function(req, res, next) {
    res.send('respond with a resource');
  });


  app.get('/', function (req, res) {
    res.render('index', { user : req.user });
  });

  app.get('/register', function(req, res) {
    res.render('register', { });
  });

  app.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
          return res.render("register", {info: "Sorry. That username already exists. Try again."});
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
  });

  app.get('/login', function(req, res) {
    res.render('login', { user : req.user });
  });

  app.post('/login', passport.authenticate('local'), function(req, res) {
    res.redirect('/');
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/ping', function(req, res){
    res.status(200).send("pong!");
  });


};
