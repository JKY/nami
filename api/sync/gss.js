var sys = require('sys'),
    mongo = require('../../lib/db').mongo,
    color = require('colors'),
    format = require('util').format,
    GoogleSpreadsheet = require("google-spreadsheet"),
    schedule = require('node-schedule'),
    dbo = require('./dbo'),
    util = require('../../lib/util');

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

/* 同步服务 */
var syncer = module.exports = function(rule,collection,callback){
    /* 启动同步服务 */
    //var rule = new schedule.RecurrenceRule();
    //rule.second = 0;
    var CREDS = require('../../config/SpreadSheet4RobinForm-f85de341d7a7.json');
    var locked = false;
    var job = schedule.scheduleJob(rule, function(){
        if(!locked){
             locked = true;
             dbo.get(collection,{'sync':false},function(err,result){
                  if(err){
                      sys.log('form data error:' + err);
                  }else{
                      if(result.length == 0){
                          sys.log('No data need sync'.green);
                      }else{
                          sys.log(format('start sync data with google spreadsheet,total=%s',result['length']).yellow);
                      };
                      result.forEach(function(data){
                         sync_with_google_spreadsheet(CREDS,data,function(err,data,sheet){
                               if(!err){
                                    dbo.update(collection, {'_id':data['_id']}, {'sync':true},function(err,_){
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
    callback(job);
};