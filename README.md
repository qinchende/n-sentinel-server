# n-sentinel-server
 NodeJS实现服务器监控工具[n-sentinel]的服务器端程序，采集所有客户端的数据，存储分析并提供数据访问API。

Client：[n-sentinel-client](https://github.com/qinchende/n-sentinel-client)

Server：[n-sentinel-server](https://github.com/qinchende/n-sentinel-server)

ManagerPages：[n-sentinel-view](https://github.com/qinchende/n-sentinel-view)


**添加测试数据**
```bash
# 比如已有Redis(127.0.0.1:32501)，在控制台向服务器列表加入一台服务器
127.0.0.1:32501> hset n_snt_servers "10.10.11.11" "[\"133\",\"Nginx\",0]"
127.0.0.1:32501> hset n_snt_servers "10.10.12.11" "[\"134\",\"APP\",0]"
```
