var request = require('request');

 function captcha(req, res, next) {
    var secret = '6LfwIyYUAAAAAPBdFdRPNZ7c-llt0nBb7O9DSUP0';
    var response = req.body.response;

    request.post({
      url:'https://www.google.com/recaptcha/api/siteverify', 
      form: {
        secret: secret,
        response:response}
      }, 
      function(err,httpResponse,body){ 
        if (err) {
          console.log("Error: ", err)
          return next(error)
        } else {
          console.log("RESPONSE", body);
          return res.status(200)
            .jsonp({
              status: 'success',
              data: body,
              message: 'response from captcha'
            });
        };
      })
 };

module.exports = {
 	captcha: captcha
 };