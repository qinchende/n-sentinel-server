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
        // // 特殊API调用会留下特殊参数，比如（APP，微信）
        // if (!req.pms['__cm_from'] && req.path !== '/r_server_time' && !Utl.isReqFromAPP(req)) {
        //     var jpc     = req.pms['jpc'];
        //     var _stamp  = req.pms['_stamp'];
        //
        //     if (_stamp && jpc && jpc.length >= 10) {
        //         var _stamp_init = parseInt(req.pms['_stamp_init'] || '0');
        //
        //         // 请求到达服务器时间不能超过15秒（网络延时时间）
        //         if (_stamp_init !== 1 && Math.abs(Date.diff(Gd.Server.getTM(), _stamp)) > 15000) {
        //             return res.send('(∩_∩)');
        //         }
        //     } else { return res.send('(∩_∩)'); }
        // }

        Gd.Ses.sesToken(reqF, resF, next, Gd.isNeedLogin);
    });
};
