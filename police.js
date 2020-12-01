module.exports = function(fty) {
    fty.addHook('onReady', (next) => {
        Gd.Ses.tokenInit({
            redisCnf:               {redis: S32500},
            project_key:            'n-sentinel-server',
            checkTokenIP:           false,
        });
        next();
    });

    // 请求已正确进入路由
    fty.addHook('onRequest', (reqF, resF, next) => {
        next();
    });

    // 请求通过验证，处理之前
    fty.addHook('preHandler', (reqF, resF, next) => {
        Gd.Ses.sesToken(reqF, resF, next, Gd.isNeedLogin);
    });
};
