let init = Gd.conn.connSmsPlatform;
var SmsVender;
module.exports = function (key) {
    if (key === 'app') {

    } else if (key === 'king') {
        Gd.global('SmsVender', init(Env.smsCnf));
    }
};
