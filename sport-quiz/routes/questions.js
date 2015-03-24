module.exports = function (app) {
  app.get('/questions', function(req, res, next) {
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
};
