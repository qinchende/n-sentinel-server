exports.app_env = {
    host: '0.0.0.0',
    port: 9991
};

exports.fix = {
    myIP_WAN:   'xx.xx.xx.xx',
    myIP_LAN:   'xx.xx.xx.xx',
    secret:     'n*sentinel*XYz',   // TODO：请修改这个秘钥
    agent:      'http://xx.xx.xx.xx:8189/agent'
};

// 发送短信的通道
exports.smsCnf = {
    adminPhone: '13800138000',
    host: 'http://xx.xx.xx.xx:10230/send_sms',
    access_key: '48ysc30b9dfmx9a316871d04e6b2d2fd22576axx'
};

// ---------------------------------------------------------------------------------------------------------------------
// REDIS DB CONFIG
const sentinel = [
    {host: 'sentinel IP1', port: 11111},
    {host: 'sentinel IP2', port: 11111},
    {host: 'sentinel IP3', port: 11111},
];
exports.redis = {
    // C32500:     {n:'N32500', s:sentinel, pass:'yxx.xxx@x'},
    // C32500:     {p:32500, h:'127.0.0.1', pass:'yxx.xxx@x'},
    // C32501:     {p:32501, h:'127.0.0.1', pass:'yxx.xxx@x'}
    C32500:     {p:32500, h:'127.0.0.1'},
    C32501:     {p:32501, h:'127.0.0.1'}
};
