var apn = require('apn');
var express = require('express');
var fs = require('fs');
var path = process.cwd();
var pool = require(path + '/config/database');
var router = express.Router();
var query = "select device token query";

router.get('/', function(req, res, next) {
    pool.getConnection(function(err,connection){
        if (err) {
            connection.release();
            console.log(err);
            throw err;
        }
        connection.query(query,['ios','Y'],function(err,rows){
            connection.release();

            if(!err) {
                res.render('apn', { title: 'iOS Push 발송 대상 : ' + rows.length + '건' });
            }
        });
        connection.on('error', function(err) {
            connection.release();
            console.log(err);
            throw err;
            return;
        });
    });
});

router.post('/send', function(req, res, next) {
    // Developer
    /*
     var options = {
     gateway : "gateway.sandbox.push.apple.com",
     cert: './keys/cert-dev.pem',
     key: './keys/key-dev.pem',
     production: false
     };
     */

    // AppStore 배포, Adhoc 배포
    var options = {
        gateway : "gateway.push.apple.com",//"gateway.sandbox.push.apple.com",
        //cert: './keys/cert.pem',
        //key: './keys/key.pem',
        production: true
    };

    var note = new apn.Notification();
    note.badge = 1;
    note.alert = "테스트 푸쉬";
    note.payload = {"link": "http://m.oneshop.co.kr/search?query=%EB%82%98%EC%9D%B4%ED%82%A4", "title" : "알림" };

    //테스트 기기 토큰 존재할 경우 테스트 발송
    if(req.body.token){
        console.log("테스트 발송 : " + req.body.token);

        //TEST
        tokens = [req.body.token];

        var apnConnection = new apn.Connection(options);

        var myDeviceArray = [ ]
        for (var i=0; i<tokens.length; i++) {
            var token = tokens[i];//'앞에서 Xcode로 build 하면서 획득한 아이폰 디바이스 토큰을 입력한다.'
            var myDevice = new apn.Device(token);
            myDeviceArray.push(myDevice);
        }

        try {
            apnConnection.pushNotification(note, myDeviceArray);
        } catch (e) {
            console.log("apn exception : " + e);
        }

        res.render('result', { title: tokens.length + '건 푸쉬 발송 완료' });
    } else {
        var tokens = [];
        pool.getConnection(function(err,connection){
            if (err) {
                connection.release();
                console.log(err);
                throw err;
            }
            connection.query(query,['ios','Y'],function(err,rows){
                connection.release();

                if(!err) {
                    console.log("실제 발송 시작 : " + rows.length + "건");

                    for (var i = 0; i < rows.length; i++) {
                        //console.log(rows[i].token);
                        tokens[i] = rows[i].token;
                    }

                    var apnConnection = new apn.Connection(options);

                    var myDeviceArray = [ ]
                    for (var i=0; i<tokens.length; i++) {
                        var token = tokens[i];//'앞에서 Xcode로 build 하면서 획득한 아이폰 디바이스 토큰을 입력한다.'
                        var myDevice = new apn.Device(token);
                        myDeviceArray.push(myDevice);
                    }

                    try {
                        apnConnection.pushNotification(note, myDeviceArray);
                    } catch (e) {
                        console.log("apn exception : " + e);
                    }

                    res.render('result', { title: tokens.length + '건 푸쉬 발송 완료' });
                }
            });
            connection.on('error', function(err) {
                connection.release();
                console.log(err);
                throw err;
                return;
            });
        });
    }
});

module.exports = router;
