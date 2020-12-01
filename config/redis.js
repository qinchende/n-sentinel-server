let init = Gd.conn.connIORedis;

var W32500, W32501;
module.exports = function(key, o) {
    o = o || [];

    if (key === 'app') {
        Gd.global('W32500', init(Env.redis.C32500, 'w'));
        Gd.global('W32501', init(Env.redis.C32501, 'w'));

    } else if (key === 'king') {
        Gd.global('W32500', init(Env.redis.C32500, 'w'));
        Gd.global('W32501', init(Env.redis.C32501, 'w'));
    }
};
