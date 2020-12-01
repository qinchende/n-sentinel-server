const fp = require('fastify-plugin');

function routePlugin (fty, opts, done) {
    Gd.commonHandler(fty, opts);
    Gd.routeDir(fty, __dirname, './controllers', '/');

    done();
}
module.exports = fp(routePlugin);
