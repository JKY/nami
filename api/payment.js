var sys = require('sys'),
    crypto = require('crypto'),
    mongo = require('../lib/db').mongo,
    color = require('colors'),
    format = require('util').format,
    GoogleSpreadsheet = require("google-spreadsheet"),
    schedule = require('node-schedule'),
    google_sheet_syncer = require('./sync/gss'),
    dbo = require('./sync/dbo'),
    moment = require('moment'),
    util = require('../lib/util');

var COL_NAME = "payment"; 

/* 启动同步服务 */
var rule = new schedule.RecurrenceRule();
rule.second = 30;
var syncer = new google_sheet_syncer(
    rule,
    COL_NAME,
    function(job){
      // nothing todo
    }
);

/* API 定义 */
var endpoints = {
  get : {
      notify: function(req,resp){
           var q = req['query'];
           var extr = q['extr'];
           var gssid = '';
           var appid = '';
           var tmp = extr.split(',');
           tmp.forEach(function(s){
              var item = s.split(':');
              if(item.length == 2){
                  if(item[0] == 'gssid'){
                      gssid = item[1];
                  };
                  if(item[0] == 'appid'){
                      appid = item[1];
                  }
              };
           });
           if(gssid == ''){
              sys.log('gssid missing'.red);
              util.out.json(resp,200,{'err':'gssid required'});
              return;
           };
           var orderid = q['orderid'];
           var amount = q['amount'];
           var openid  = q['openid'];
           var status  = q['status'];
           if(!util.validate.is('string',orderid) ||
                !util.validate.is('string',openid) ||
                  !util.validate.is('string',gssid) ){
              util.out.json(resp,200,{'error':'param error'});
              return;
           };
           var hash = crypto.createHash('md5');
           hash.update(new Buffer(gssid + orderid + amount + openid + appid + 'uxe1!@ZEee33q'));
           var cert = hash.digest('hex');
           var data = {
              'time'   : moment().format('YYYY-MM-DD HH:mm:ss'),
              'openid' : openid,
              'orderid': orderid,
              'appid'  : appid,
              'amount' : amount,
              'cert'   : cert
           };
           dbo.add(COL_NAME,gssid,appid,data,function(err,_){
                util.out.json(resp,200,{'err':err,'url':'http://robin.postio.me'});
           });
      }
  }
}

/* 挂载 form data api */
module.exports = function(app){
  for(var method in endpoints){
      util.bind("/pay", endpoints[method], app[method], app, null);
  }
}

