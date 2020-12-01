const fty = require('fastify')({
    logger: false,
    disableRequestLogging: true,
    ignoreTrailingSlash: false,
});
const Gd = require('fastify-guarder')({
    proxy: { host: '10.10.10.10', port: 8180 }
});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const Cst = Gd.global('Cst', require('./config/const'));
const Env = Gd.global('Env', require('./config/env'));
const appCnf = Env.app_env;
const ServerMate = Gd.global('ServerMate', {
    env: 'product',
    port: appCnf.port,
    host: appCnf.host,
    jsonp_callback_name: 'jpc'
});

const scriptPath = (process.argv[1] || '').replace(/\\/gi, '/');
if (scriptPath.indexOf('/server/') < 0) {
    fty.listen(appCnf.port, appCnf.host, function (err, address) {
        if (err) {
            fty.log.error(err);
            process.exit(1);
        }
        Log.log(`Singleton pid(${process.pid}) listening as ${address}`);
    });
}

// 主要生命周期
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Gd.hookRequestDefault(fty);     // 统一风格，所有项目共享的特性
require('./police')(fty);       // 每个项目不同的业务逻辑判断

fty.register(require('./routes'), {
    printRouteTree: true
});

require('./config/redis')('app');
// require('./config/mysql')('app');
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

module.exports = fty;
