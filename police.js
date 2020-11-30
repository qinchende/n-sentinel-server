require('./node_lib/web/session')(Utl.applyIf(Env.redis.C41501, {
    project_key:            'n-sentinel-server',
    session_key:            'user_id',

    current: function(req, res, user_id, cb) {
        if (!req.Curr) {
            req.Curr = req.SES;
            cb(true)
        } else {
            cb(true);
        }
    }
}));

exports.check = function (req, res, next) {
    if ('/favicon.ico' === req.url) {
        res.status(200).send('');
    } else {
        next();
    }
};

exports.sessionCheck = function(req, res, next){
    Ses.sesToken(req, res, next, is_need_login, is_need_session);
};

function is_need_login(req, res) {
    return req.url.indexOf('/r_') < 0;
}

function is_need_session(req, res) {
    return true;
}
