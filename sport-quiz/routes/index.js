var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'FB Sport Quizz based on Express' });
});

/* GET rules page */
router.get('/rules', function(req, res) {
  res.render('rules', { title: 'Sport Quiz Rules' })
});

module.exports = router;
