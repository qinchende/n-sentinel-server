const cluster = require('cluster');

if (cluster.isMaster) {
    let numCPUs = require('os').cpus().length;
    if (numCPUs > 4) { numCPUs = 4; }

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        console.log('Worker %d died (%s). Try to restart after 10s...', worker.process.pid, signal || code);
        setTimeout(cluster.fork, 10000);
    });
} else {
    const fty = require('../app');

    const host = Gd.ServerMate.host, port = Gd.ServerMate.port;
    fty.listen(port, host, function (err, address) {
        if (err) {
            fty.log.error(err);
            process.exit(1);
        }
        console.log(`Worker pid(${process.pid}) listening as ${address}`);
    });
}