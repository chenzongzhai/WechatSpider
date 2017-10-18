# WechatSpider
实现微信公众号历史文章的批量采集
==================================

* 支持公众号自动翻页
* 支持自动切换公众号
* 文章历史页增量抓取

## 依赖

* [anyproxy](http://anyproxy.io/cn.html)
    * 一个开放式的HTTP代理服务器
    * 基于node.js，开放二次开发能力，允许自定义请求处理逻辑
    * 支持Https明文解析
* python
    * 一种面向对象的解释型计算机程序设计语言
    * 文章历史页数据处理

## 爬取方法

* 手机端设置代理（anyproxy），微信客户端请求某一公众号历史消息页，代理将请求返回的数据拦截并post到api接口，api返回下一页url，代理将下一页url以js的方式添加到数据中并返回给微信客户端，实现自动翻页和公众号切换。

## 部分代码说明

* anyproxy
'''
'''

## 本项目参考

* [微信公众号内容的批量采集与应用](https://zhuanlan.zhihu.com/c_65943221)
* [微信协议简单调研笔记](http://www.blogjava.net/yongboy/archive/2015/11/05/410636.html)
* [挖掘微信Web版通信的全过程](http://www.tanhao.me/talk/1466.html/)

### QQ:754770516
