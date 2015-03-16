var express = require('express');
var router = express.Router();


/* GET questions listing. */
router.get('/', function(req, res, next) {


  var questionList;


  //retarded but only way to get all questions ?
  app.models.Question.find({}, function(err, questions) {
    var list = {};

    questions.forEach(function(q) {
      list[q._id] = q;
    });

    questionList = list;
  });


  res.render('questions', { title: 'Questions', questions: questionList });
});

module.exports = router;
