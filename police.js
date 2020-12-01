module.exports = function(fty) {
    fty.addHook('onReady', (next) => {
        Gd.Ses.tokenInit({
            redisCnf:               {redis: S44301},

            project_key:            'fds_user_reg',
            checkTokenIP:           false,

            secs_ip_count:          100,                // IP token 生成频率
            secs_access_count:      900,                // 每个 token 访问次数
            secs_expire:            300,                // 统计周期    (秒) 5分钟
            secs_lock:              3600*6              // 限制锁定时长 (秒)
        });
        next();
    });

    fty.addHook('onRequest', (reqF, resF, next) => {
        next();
    });

    fty.addHook('preHandler', (reqF, resF, next) => {

        Gd.Ses.sesToken(reqF, resF, next, Gd.isNeedLogin);
    });
};
