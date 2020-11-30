require('./node_lib/tl');
var Cst = TL.global('Cst', require('./config/const'));
var Env = TL.global('Env', require('./config/env'));

var express     = require('express'),
    app         = express(),
    bodyParser  = require('body-parser');

var request     = require('./node_lib/web/request'),
    police      = require('./police'),
    server      = require('./config/env').app_env;

app.set('_port', server.port);
app.set('_host', server.host);
app.set('env', 'product');
app.set('jsonp callback name', 'jpc');

app.use(police.check);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(request.bodyQuery);
app.use(request.logger);
app.use(police.sessionCheck);

if ((process.argv[1] || '').indexOf('/server/') < 0) {
    app.listen(server.port, server.host, function(){
        console.log("Express listening on " + server.host + ":" + server.port);
    });
}
// *********************************************************************************************************************
var Router = TL.global('Router', function() { return express.Router; });

require('./config/redis')('app');
require('./routes')(app);

module.exports = app;