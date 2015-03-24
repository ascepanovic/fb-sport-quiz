module.exports = function (app) {

  // 404s
  app.use(function (req, res, next) {
    res.status(404);

    if (req.accepts('html')) {
      // return res.send("<h2>We couldn't find that page.</h2>");
      var err = new Error("We couldn't find that page.");
      next(err);
    }

    // if (req.accepts('json')) {
    //   return res.json({ error: 'Not found' });
    // }

    // // default response type
    // res.type('txt');
    // res.send("Hmmm, couldn't find that page.");
  })

   // 500
   // development error handler
   // will print stacktrace
   if (app.get('env') === 'development') {
       app.use(function(err, req, res, next) {
           res.status(err.status || 500);
           res.render('error', {
               message: err.message,
               error: err
           });
       });
   }

   // production error handler
   // no stacktraces leaked to user
   app.use(function(err, req, res, next) {
       res.status(err.status || 500);
       res.render('error', {
           message: err.message,
           error: {}
       });
   });

}
