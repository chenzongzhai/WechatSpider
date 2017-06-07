/**
 * Created by dazhai on 2017/5/17.
 */
var path = require("path"),
    fs = require("fs"),
    img = fs.readFileSync('/Users/dazhai/wxBot/temp/img_3538500157365673532.jpg');

var interceptFlag = false,
    db = require('./db.js'),
    csv = require('./csv.js');

module.exports = {
    token: Date.now(),
    summary: function () {
        var tip = "the default rule for AnyProxy.";
        return tip;
    },

    shouldUseLocalResponse: function (req, reqBody) {
        //intercept all options request
        if (/mmbiz\.qpic\.cn/i.test(req.url)) {
            req.replaceLocalFile = true;
            return true;
        } else {
            return false;
        }
    },

    dealLocalResponse: function (req, reqBody, callback) {
        if (req.replaceLocalFile) {
            callback(200, {"content-type":"image/png"},img );
        }
    },

    replaceRequestProtocol: function (req, protocol) {
    },

    replaceRequestOption: function (req, option) {
        var newOption = option;
        if(/google|btrace/i.test(newOption.headers.host)){//这里面的正则可以替换成自己不希望访问的网址特征字符串，这里面的btrace是一个腾讯视频的域名，经过实践发现特别容易导致浏览器崩溃，所以加在里面了，继续添加可以使用|分割。
            newOption.hostname = "www.baidu.com";//这个ip也可以替换成其他的
            newOption.port     = "80";
            }
            return newOption;
    },

    replaceRequestData: function (req, data) {
    },

    replaceResponseStatusCode: function (req, res, statusCode) {
    },

    replaceResponseHeader: function (req, res, header) {
    },

    getNextChunk: function (url, delay, nonce) {
        if (nonce) {
            var next = '<script nonce="' + nonce + '" type="text/javascript">';
        } else {
            var next = '<script type="text/javascript">';
        }
        next += 'setTimeout(function(){window.location.href="' + url + '";},' + delay + ');';
        next += '</script>';
        return next;
    },

    getTimeOutChunk: function (url, delay) {
        var next = '<script type="text/javascript">';
        next += 'setTimeout(function(){window.location.href="' + url + '";},' + delay * 10 + ');';
        next += '</script>';
        return next;
    },
    
    getNotification: function () {
        return '<h1 style="color:red; font-size:20px; text-align: center; ' +
            'margin-top: 10px; margin-bottom: 10px;">5秒后自动刷新</h1>';
    },

    getRetry: function (uu) {
        return '<h1 style="color:red; font-size:20px; text-align: center; ' +
            'margin-top: 10px; margin-bottom: 10px;">出错20s后重试 <br /> uu </h1>';
    },
    
    //替换服务器响应的数据,5s自动翻页,翻页逻辑在python接口处理(可实现增量爬取)
    replaceServerResDataAsync: function (req, res, serverResData, callback) {
        var that = this;
        //首次访问
        if (/mp\/profile_ext\?action=home/i.test(req.url)) {
            var regUrl = /__biz=(.*?)&/;
            var retBiz = regUrl.exec(req.url);
            var biz = retBiz[1];
            try {
                var reg = /var msgList = \'(.*?)\';/;
                var ret = reg.exec(serverResData.toString());
                if (!ret) {
                   console.log('profile_ext ' + req.url + ' home ' + ret);
                   callback(serverResData);
                   return;
                }
                var ret = ret[1].replace(/&quot;/g, '"');
                //console.log('profile_ext ' + req.url + ' homepage ' + ret);
                var rest = require('restler');
                rest.post('http://127.0.0.1:8080/api_wechat', {
                    data: {ret: ret, url: req.url, method: 'page'},
                }).on('complete', function (data, response) {
                    //console.log(data, response);
                    if (response.statusCode == 200) {
                        var next = that.getNextChunk(data, 5000);
                        var timeRetry = that.getTimeOutChunk(req.url, 5000);
                        var note = that.getNotification();
                        //console.log('server data ' + note + serverResData + next);
                        callback(note + serverResData + next + timeRetry);
                    }
                });
            }
            catch (e) {
                console.log(e);
                //出错重试
                var startUrl = 'https://mp.weixin.qq.com/mp/profile_ext?action=home&'
                        '__biz=' + biz + '{}&scene=124#wechat_redirect';
                var next = that.getNextChunk(startUrl, 20000);
                var note = that.getRetry(startUrl);
                callback(note + serverResData + next);
            }
        } else if (/mp\/getmasssendmsg/i.test(req.url)) {
            var regUrl = /__biz=(.*?)&/;
            var retBiz = regUrl.exec(req.url);
            var biz = retBiz[1];
            try {
                var reg = /var msgList = (.*?);\r\n/;
                var ret = reg.exec(serverResData.toString());
                //console.log('getmasssendmsg ' + req.url + ' homepage ' + ret);
                if (!ret) {
                    console.log('getmasssendmsg ' + req.url + ' homepage ' + ret);
                    callback(serverResData);
                    return;
                }
                var ret = ret[1].replace(/&quot;/g, '"');
                //console.log('getmasssendmsg ' + req.url + ' homepage ' + ret);
                var rest = require('restler');
                rest.post('http://127.0.0.1:8080/api_wechat', {
                    data: {ret: ret, url: req.url, method: 'page'},
                }).on('complete', function (data, response) {
                    //console.log(data, response);
                    if (response.statusCode == 200) {
                        var next = that.getNextChunk(data, 5000);
                        var timeRetry = that.getTimeOutChunk(req.url, 5000);
                        var note = that.getNotification();
                        //console.log('server data ' + note + serverResData + next);
                        callback(note + serverResData + next + timeRetry);
                    }
                });
            }
            catch (e) {
                console.log(e);
                //出错重试
                var startUrl = 'https://mp.weixin.qq.com/mp/profile_ext?action=home&'
                        '__biz=' + biz + '{}&scene=124#wechat_redirect';
                var next = that.getNextChunk(startUrl, 20000);
                var note = that.getRetry(startUrl);
                callback(note + serverResData + next);
            }
        } else if (/mp\/profile_ext\?action=getmsg/i.test(req.url)) {
            var regUrl = /__biz=(.*?)&/;
            var retBiz = regUrl.exec(req.url);
            var biz = retBiz[1];
            try {
                var reg = /var msgList = \'(.*?)\';/;
                var ret = reg.exec(serverResData.toString());
                if (!ret) {
                   console.log('profile_ext ' + req.url + ' getmsg ' + ret);
                }
                var ret = ret[1].replace(/&quot;/g, '"');
                //console.log('profile_ext ' + req.url + ' getmsg ' + ret);
                var rest = require('restler');
                rest.post('http://127.0.0.1:8080/api_wechat', {
                    data: {ret: ret, url: req.url, method: 'page'},
                }).on('complete', function (data, response) {
                    //console.log(data, response);
                    if (response.statusCode == 200) {
                        var next = that.getNextChunk(data, 5000);
                        var timeRetry = that.getTimeOutChunk(req.url, 5000);
                        var note = that.getNotification();
                        //console.log('server data ' + note + serverResData + next);
                        callback(note + serverResData + next + timeRetry);
                    }
                });
            }
            catch (e) {
                console.log(e);
                //出错重试
                var startUrl = 'https://mp.weixin.qq.com/mp/profile_ext?action=home&'
                        '__biz=' + biz + '{}&scene=124#wechat_redirect';
                var next = that.getNextChunk(startUrl, 20000);
                var note = that.getRetry(startUrl);
                callback(note + serverResData + next);
            }
        } else if (/mp\/get_data_msg/i.test(req.url)) {
            try {
                var rest = require('restler');
                rest.post('http://127.0.0.1:8080/api_wechat', {
                    data: {ret: '', url: req.url, method: 'refresh'},
                }).on('complete', function (data, response) {
                    //console.log(data, response);
                    if (response.statusCode == 200) {
                        var next = that.getNextChunk(data, 60000*5);
                        var note = that.getNotification();
                        //console.log('server data ' + note + serverResData + next);
                        callback(note + serverResData + next);
                    }
                });
            }
            catch (e) {
                console.log(e);
                //出错重试
                var next = that.getNextChunk(req.url, 20000);
                var note = that.getRetry(req.url);
                callback(note + serverResData + next);
            }
        }else {
            callback(serverResData);
        }
    },
    pauseBeforeSendingResponse: function (req, res) {
    },

    shouldInterceptHttpsReq: function (req) {
        return interceptFlag;
    },

    //[beta]
    //fetch entire traffic data
    fetchTrafficData: function (id, info) {
    },

    setInterceptFlag: function (flag) {
        interceptFlag = flag;
    },
};
