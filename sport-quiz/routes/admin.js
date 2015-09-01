module.exports = function (app) {

  //Just as admin placeholder, but majority of this should be maybe written in some other language insted of node
  //or this all can be different node/golang server

  app.get('/admin', function(req, res, next) {
    res.send('Holla from administration interface');
  });
};
