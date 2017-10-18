/**
 * Created by dazhai on 2017/5/17.
 */
var path = require("path"),
    fs = require("fs"),
    //本地图片路径
    img = fs.readFileSync('img_3538500157365673532.jpg');

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

    //替换为本地图片,节省带宽
    dealLocalResponse: function (req, reqBody, callback) {
        if (req.replaceLocalFile) {
            callback(200, {"content-type":"image/png"}, img);
        }
    },

    replaceRequestProtocol: function (req, protocol) {
    },

    replaceRequestOption: function (req, option) {
        var newOption = option;
        //模拟器会后台访问google等,替换不希望访问的网址特征字符串,继续添加可以使用|分割。
        if(/google|btrace/i.test(newOption.headers.host)){
            //这个ip也可以替换成其他的
            newOption.hostname = "www.baidu.com";
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

    //添加js代码,实现下一页或公众号切换
    getNextChunk: function (url, delay, nonce) {
        if (nonce) {
            return '<script nonce="' + nonce + '" type="text/javascript">' +
                   'setTimeout(function(){window.location.href="' + url + '";},'
                   + delay + ')</script>'
        } else {
            return '<script type="text/javascript">setTimeout(function()' +
                   '{window.location.href="' + url + '";},' + delay + ')</script>'
        }
    },

    //在页面增加提示信息
    getNotification: function (url, retry) {
        if (retry) {
            return '<h1 style="color:red; font-size:20px; text-align: center; ' +
                   'margin-top: 10px; margin-bottom: 10px;"><a href="' + url +
                   '">5秒后自动刷新或点击手动刷新</a></h1>';
        } else {
            return '<h1 style="color:red; font-size:20px; text-align: center; ' +
                   'margin-top: 10px; margin-bottom: 10px;"><a href="' + url +
                   '">出错20s后重试或点击手动刷新</a></h1>';
        }
    },

    //替换服务器响应的数据,5s自动翻页,翻页逻辑在python接口处理(可实现增量爬取)
    replaceServerResDataAsync: function (req, res, serverResData, callback) {
        var that = this,
            rest = require('restler'),
            regUrl = /__biz=(.*?)&/,
            retBiz = regUrl.exec(req.url);
        if (retBiz) {
            var biz = retBiz[1],
                startUrl = 'https://mp.weixin.qq.com/mp/profile_ext?action=home&' +
                           '__biz=' + biz + '&scene=124#wechat_redirect';
        } else {
            var startUrl = req.url;
        }
        //首次访问
        if (/mp\/profile_ext\?action=home/i.test(req.url)) {
            try {
                var reg = /var msgList = \'(.*?)\';/,
                    ret = reg.exec(serverResData.toString());
                if (!ret) {
                   console.log('profile_ext ' + req.url + ' home ' + ret);
                   callback(serverResData);
                   return;
                }
                var ret = ret[1].replace(/&quot;/g, '"');
                rest.post('http://127.0.0.1:8080/api_wechat', {
                    data: {ret: ret, url: req.url, method: 'page'}
                }).on('complete', function (data, response) {
                    if (response.statusCode == 200) {
                        var next = that.getNextChunk(data, 5000);
                        var timeRetry = that.getNextChunk(req.url, 20000);
                        var note = that.getNotification();
                        callback(note + serverResData + next + timeRetry);
                    }
                });
            }
            catch (e) {
                console.log(e);
                //出错重试
                var next = that.getNextChunk(startUrl, 20000);
                var note = that.getNotification(startUrl, 'Y');
                callback(note + serverResData + next);
            }
        //文章历史页
        } else if (/mp\/getmasssendmsg/i.test(req.url)) {
            try {
                var reg = /var msgList = (.*?);\r\n/;
                var ret = reg.exec(serverResData.toString());
                if (!ret) {
                    console.log('getmasssendmsg ' + req.url + ' homepage ' + ret);
                    callback(serverResData);
                    return;
                }
                var ret = ret[1].replace(/&quot;/g, '"');
                rest.post('http://127.0.0.1:8080/api_wechat', {
                    data: {ret: ret, url: req.url, method: 'page'}
                }).on('complete', function (data, response) {
                    if (response.statusCode == 200) {
                        var next = that.getNextChunk(data, 5000);
                        var timeRetry = that.getNextChunk(req.url, 20000);
                        var note = that.getNotification();
                        callback(note + serverResData + next + timeRetry);
                    }
                });
            }
            catch (e) {
                console.log(e);
                //出错重试
                var next = that.getNextChunk(startUrl, 20000);
                var note = that.getNotification(startUrl, 'Y');
                callback(note + serverResData + next);
            }
        //文章历史页
        } else if (/mp\/profile_ext\?action=getmsg/i.test(req.url)) {
            try {
                var reg = /var msgList = \'(.*?)\';/;
                var ret = reg.exec(serverResData.toString());
                if (!ret) {
                   console.log('profile_ext ' + req.url + ' getmsg ' + ret);
                }
                var ret = ret[1].replace(/&quot;/g, '"');
                rest.post('http://127.0.0.1:8080/api_wechat', {
                    data: {ret: ret, url: req.url, method: 'page'}
                }).on('complete', function (data, response) {
                    if (response.statusCode == 200) {
                        var next = that.getNextChunk(data, 5000);
                        var timeRetry = that.getNextChunk(req.url, 20000);
                        var note = that.getNotification();
                        callback(note + serverResData + next + timeRetry);
                    }
                });
            }
            catch (e) {
                console.log(e);
                //出错重试
                var next = that.getNextChunk(startUrl, 20000);
                var note = that.getNotification(startUrl, 'Y');
                callback(note + serverResData + next);
            }
        //一轮爬取完毕,等待5分钟
        } else if (/mp\/get_data_msg/i.test(req.url)) {
            try {
                rest.post('http://127.0.0.1:8080/api_wechat', {
                    data: {ret: '', url: req.url, method: 'refresh'}
                }).on('complete', function (data, response) {
                    if (response.statusCode == 200) {
                        var next = that.getNextChunk(data, 60000*5);
                        var note = that.getNotification();
                        callback(note + serverResData + next);
                    }
                });
            }
            catch (e) {
                console.log(e);
                //出错重试
                var next = that.getNextChunk(req.url, 20000);
                var note = that.getNotification(req.url, 'Y');
                callback(note + serverResData + next);
            }
        } else {
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
    }
};
