var init = require('../node_lib/conn/ioredis').connRedis;

var W41501, W32501;
module.exports = function(key, o) {
    o = o || [];

    if (key === 'app') {
        Gd.global('W41501', init(Env.redis.C41501, 'w'));
        Gd.global('W32501', init(Env.redis.C32501, 'w'));
        Gd.global('R41502', init(Env.redis.C41502, 'r'));
    } else if (key === 'king') {
        Gd.global('W41502', init(Env.redis.C41502, 'w'));
        Gd.global('W32501', init(Env.redis.C32501, 'w'));
    }
};