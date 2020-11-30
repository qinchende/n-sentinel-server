var fs = require('fs');

module.exports = function(app, io) {
    var comm = require('./node_lib/web/common');
    app.all('/r_server_time', comm.serverTime);

    Asy.series([
        function(cb) { require_files(app, cb); },
        function(cb) { init_routes(app, cb); }
    ], function(err, values) {
        if (err) { Log.log('Init routes error: ' + err); }
    });
};

function init_routes(app, mcb) {
    // 模式匹配 所有Model的[add|del|update|query]
    app.all('/st/:pg/:action',                  V.agent);
    app.all('/api/:pg/:action',                 V.agent_api);

    mcb(null, null);
}

function require_files(app, mcb) {
    require('./orm_lib/ctrl');  // global.C
    require('./orm_lib/view');  // global.V

    Asy.series([
        function(cb) { require_dir('./controllers', C, cb); },
        function(cb) { require_dir('./views', V, cb); }
    ], function(err, values) {
        if (err) { Log.log('Require mvc files error: ' + err); }
        mcb(err, null);
    });
}

function require_dir(dir, space, cb) {
    cb = cb || Utl.fn;

    // Log.log(dir);
    var items = fs.readdirSync(__dirname + '/' + dir);
    for (var i = 0; i < items.length; i++) {
        var node = items[i];
        if (node == '.svn') { continue; }

        var it = dir + '/' + node, stats = fs.statSync(__dirname + '/' + it);
        // Log.log(it);
        if (stats.isDirectory()) {
            space[node] = {};
            require_dir(it, space[node]);
        } else {
            require(it);
        }
    }
    cb(null, null);
}
