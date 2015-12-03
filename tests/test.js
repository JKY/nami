var sys = require('sys'),
    crypto = require('crypto'),
    mongo = require('../lib/db').mongo,
    color = require('colors'),
    dbo = require('../api/sync/dbo'),
    moment = require('moment'),
    util = require('../lib/util');

var COL_NAME = "payment"; 
var data = {
    'time'   : moment().format('YYYY-MM-DD HH:mm:ss'),
    'openid' : 'openid',
    'orderid': 'orderid',
    'app'    : 'appid',
    'amount' : 1000000,
    'cert'   : 'cert'
 };
 dbo.add(COL_NAME,'1FZrsc6opWXK1z_TkHlxxtgWs9k0KFfoS6nlEZG8EYps','appid',data,function(err,_){
     console.log('done'.green);
 });