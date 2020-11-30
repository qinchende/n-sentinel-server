const cluster = require('cluster');

if (cluster.isMaster) {
    var numCPUs = require('os').cpus().length;
    if (numCPUs > 2) { numCPUs = 2; }

    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        console.log('Worker %d died (%s). Try to restart after 10s...', worker.process.pid, signal || code);
        setTimeout(cluster.fork, 10000);
    });
} else {
    var app = require('../app');

    var host = app.get('_host'), port = app.get('_port');
    app.listen(port, host, function(){
        console.log("Worker express listening on " + host + ":" + port);
    });
}