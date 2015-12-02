var sys = require('sys'),
	format = require('util').format,
	color = require('colors'),
    settings = require('../config').settings;
   
var mongodb = require("mongodb");
var mongoinstance = null;
var funcq = [];

mongodb.MongoClient.connect(format("mongodb://%s:%s/%s", 
							settings.mongo.host,
							settings.mongo.port,
							settings.mongo.dbname), function(err, db) {
	if(err !== null){
         sys.log(("database err:" + err.red));
     }else{
		 mongoinstance = db;	
		 funcq.forEach(function(func){
			func(null,db);
		 })
		 funcq.length = 0;
		 sys.log(("database connected to:" + settings.mongo.host).green);          
	 }
})

var mongo = exports.mongo = { 
    do:function (callback){
		if(mongoinstance!==null){
	        callback(null,mongoinstance);
		}else{
			console.log("func is pushed to q, db is not ready");
			funcq.push(callback);
		}
    }
}
