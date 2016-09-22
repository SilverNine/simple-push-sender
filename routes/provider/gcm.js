var express = require('express');
var gcm = require('node-gcm');
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
        connection.query(query,['android','Y'],function(err,rows){
            connection.release();

            if(!err) {
                res.render('gcm', { title: 'Android Push 발송 대상 : ' + rows.length + '건' });
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
    var serverApiKey = "serverApiKey";
    var message = new gcm.Message({
        delayWhileIdle: false,
        timeToLive: 1800,
        data: {
            title: "푸쉬 테스트",
            message: "테스트용 푸쉬 입니다.",
            imgUrl: "http://img.oneshop.co.kr/images/theme/TBNR2TILE/1_20160628162456.jpg",
            linkUrl: "http://m.oneshop.co.kr/search?query=%EC%97%90%EB%84%88%EC%8A%A4%ED%82%A8"
        }
    });

    //테스트 기기 토큰 존재할 경우 테스트 발송
    if(req.body.token){
        console.log("테스트 발송 : " + req.body.token);

        //TEST
        tokens = [req.body.token];

        var sender = new gcm.Sender(serverApiKey);

        sender.send(message, tokens, 4, function (err, result) {
            console.log(result);
        });

        res.render('result', { title: tokens.length + '건 푸쉬 발송 완료' });
    } else {
        var tokens = [];

        pool.getConnection(function(err,connection){
            if (err) {
                connection.release();
                console.log(err);
                throw err;
            }
            connection.query(query,['android','Y'],function(err,rows){
                connection.release();

                if(!err) {
                    console.log("실제 발송 시작 : " + rows.length + "건");

                    for (var i = 0; i < rows.length; i++) {
                        //console.log(rows[i].token);
                        tokens[i] = rows[i].token;
                    }

                    var sender = new gcm.Sender(serverApiKey);

                    sender.send(message, tokens, 4, function (err, result) {
                        console.log(result);
                    });

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
