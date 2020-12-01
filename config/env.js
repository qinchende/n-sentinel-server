exports.app_env = {
    host: '0.0.0.0',
    port: 9991
};

exports.fix = {
    myIP_WAN:   'xx.xx.xx.xx',
    myIP_LAN:   'xx.xx.xx.xx',
    secret:     'n*sentinel*XYz',
    agent:      'http://xx.xx.xx.xx:8189/agent'
};

// 发送短信的通道
exports.sms_config = {
    host: 'http://xx.xx.xx.xx:10230/send_sms',
    access_key: '48ysc30b9dfmx9a316871d04e6b2d2fd22576axx'
};

// ---------------------------------------------------------------------------------------------------------------------
// REDIS DB CONFIG
exports.redis = {
    C32501:     {p:32501,h:'10.10.10.11',pass:'yxx.xxx@x'},
    C41501:     {p:41501,h:'10.10.10.11',pass:'yxx.xxx@x'},
    C41502:     {p:41502,h:'10.10.10.11',pass:'yxx.xxx@x'}
};
