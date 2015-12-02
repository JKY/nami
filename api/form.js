var sys = require('sys'),
    mongo = require('../lib/db').mongo,
    color = require('colors'),
    format = require('util').format,
    GoogleSpreadsheet = require("google-spreadsheet"),
    schedule = require('node-schedule'),
    util = require('../lib/util');

/* 表单数据 */
var FORM_COL_NAME = "form"; 

/* 表单数据的CRUD */
var form_data = {

    /* 保存到数据库 */
    add: function(gssid,appid,data,callback){
        mongo.do(function(err,db){
            if(err){
              callback(err,null);
            }else{
              var col = db.collection(FORM_COL_NAME);
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
    update: function(q,data,callback){
        mongo.do(function(err,db){
            if(err){
              callback(err,null);
            }else{
              var col = db.collection(FORM_COL_NAME);
              col.update(q,{'$set':data},{'upsert':false}, callback);
            }
        })
    },

    /* 获取*/
    get: function(q,callback){
         mongo.do(function(err,db){
            if(err){
                callback(err,null);
            }else{
                var col = db.collection(FORM_COL_NAME);
                col.find(q).toArray(callback);
            }
         })
    }
};



/* 同步数据到 google spread sheets */
function sync_with_google_spreadsheet(creds,record,callback){
      // spreadsheet key is the long id in the sheets URL 
      if(record['gssid']){
          var sheet = new GoogleSpreadsheet(record['gssid']);
          // With auth -- read + write 
          // see below for authentication instructions 
          sheet.useServiceAccountAuth(creds, function(err){
              // getInfo returns info about the sheet and an array or "worksheet" objects 
              sheet.getInfo( function( err, doc ){
                  if(err){
                     sys.log('====== google sheet api err ======='.red);
                     console.log(err);
                  }else{
                      var worksheets = doc.worksheets[0];
                      worksheets.addRow(record['data'], function(err) {
                           callback(err, record, doc);
                      });
                  }
              });
          });
      }else{
          sys.log(format('%s gssid not found',record['_id']));
      }
};


var creds = require('../config/SpreadSheet4RobinForm-f85de341d7a7.json');
/* 启动同步服务 */
var rule = new schedule.RecurrenceRule();
rule.second = 0;
var locked = false;
var job = schedule.scheduleJob(rule, function(){
    if(!locked){
         locked = true;
         form_data.get({'sync':false},function(err,result){
              if(err){
                  sys.log('form data error:' + err);
              }else{
                  if(result.length == 0){
                      sys.log('No data need sync'.green);
                  }else{
                      sys.log(format('start sync data with google spreadsheet,total=%s',result['length']).yellow);
                  };
                  result.forEach(function(data){
                     sync_with_google_spreadsheet(creds,data,function(err,data,sheet){
                           if(!err){
                                form_data.update({'_id':data['_id']}, {'sync':true},function(err,_){
                                    sys.log(format('%s synced to %s',data['_id'],sheet.title).green);
                                })
                           }else{
                                sys.log(format('%s synced error:%s',data['_id'],err));
                           };
                     });
                  });
              };
              locked = false;
        });
    }else{
        sys.log('waiting for job completed');
    }
});

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
                form_data.add(gssid,appid,data,function(err,_){
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

