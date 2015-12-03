var sys = require('sys'),
    mongo = require('../../lib/db').mongo,
    color = require('colors'),
    format = require('util').format,
    util = require('../../lib/util');

/* 数据的CRUD */
var dbo = module.exports = {
    /* 保存到数据库 */
    add: function(dname,gssid,appid,data,callback){
        mongo.do(function(err,db){
            if(err){
              callback(err,null);
            }else{
              var col = db.collection(dname);
              var items = [{
                  'gssid': gssid,
                  'data':data,
                  'sync': false,
                  'appid': appid,
                  'updated': new Date().getTime()
              }];
              col.insert(items,callback);
            }
        })
    },

    /*  更新 */
    update: function(dname,q,data,callback){
        mongo.do(function(err,db){
            if(err){
              callback(err,null);
            }else{
              var col = db.collection(dname);
              col.update(q,{'$set':data},{'upsert':false}, callback);
            }
        })
    },

    /* 获取*/
    get: function(dname,q,callback){
         mongo.do(function(err,db){
            if(err){
                callback(err,null);
            }else{
                var col = db.collection(dname);
                col.find(q).toArray(callback);
            }
         })
    }
};