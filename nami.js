/**
 * Module dependencies.
 */

var express = require('express'),
	settings = require('./config').settings,
	color = require('colors'),
    sys = require('sys');

var app = module.exports = express();
app.enable('trust proxy');
app.use(function(req,resp,next){
	sys.log(req.url.green);
	next();
});

require('./api/form')(app);
require('./api/payment')(app);

if (!module.parent) {
  app.listen(settings.port);
  sys.log(('nami runnng port:' + settings.port).green);
}

