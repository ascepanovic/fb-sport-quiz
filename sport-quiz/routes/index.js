var admin = require('./admin');
var users = require('./users');
var questions = require('./questions');
var errors = require('./errors');

module.exports = function (app) {
	// home page
	app.get('/', function(req, res, next) {
    res.render('index', { title: 'FB Sport Quizz based on Express', user : req.user } ); //send user if available as well
  });

  app.get('/rules', function(req, res) {
    res.render('rules', { title: 'Sport Quiz Rules' })
  });

  //Admin routes
	admin(app);

  //Users routes
	users(app);

  //Questions routes
  questions(app);

  //Error routes
  errors(app);
};
