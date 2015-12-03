var sys = require('sys'),
    mongo = require('../lib/db').mongo,
    color = require('colors'),
    format = require('util').format,
    GoogleSpreadsheet = require("google-spreadsheet"),
    schedule = require('node-schedule'),
    google_sheet_syncer = require('./sync/gss'),
    dbo = require('./sync/dbo'),
    util = require('../lib/util');

/* 表单数据 */
var FORM_COL_NAME = "form"; 

/* 启动同步服务 */
var rule = new schedule.RecurrenceRule();
rule.second = 0;
var syncer = new google_sheet_syncer(
    rule,
    FORM_COL_NAME,
    function(job){
      // nothing todo
    }
);

/* API 定义 */
var endpoints = {
  post: {
     submit: function(req,resp){
        util.parse_form(req,resp,function(fields, files) {
            var gssid = '';
            var appid = '';
            var data = {};
            for(var name in fields){
                if(name == 'gssid'){
                    gssid = fields['gssid'];
                }else if(name == 'appid'){
                    appid = fields['appid'];
                }else{
                    data[name] = fields[name];
                }
            };
            if(gssid==''){
                util.out.json(resp,200,{'err':'gssid required'});
            }else{
                dbo.add(FORM_COL_NAME,gssid,appid,data,function(err,_){
                    util.out.json(resp,200,{'err':err,'url':'http://robin.postio.me'});
                });
            }
        });
    } // end of post
  },

  get : {
      foo: function(req,resp){
           util.out.json(resp,200,{'err':null});
      }
  }
}

/* 挂载 form data api */
module.exports = function(app){
  for(var method in endpoints){
      util.bind("/form", endpoints[method], app[method], app, null);
  }
}

