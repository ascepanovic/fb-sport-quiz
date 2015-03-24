module.exports = function (app) {
  app.get('/admin', function(req, res, next) {
    res.send('Holla from administration interface');
  });
};
