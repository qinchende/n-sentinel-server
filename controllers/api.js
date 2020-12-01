module.exports = async (fty, opts, done) => {
    Gd.getPost(fty, '/manager', async (req, res) => {
        let mdl = req.pms['mdl'];

        if (mdl === 'add')       { return me.editServer(req, res); }
        if (mdl === 'update')    { return me.editServer(req, res); }
        if (mdl === 'freeze')    { return me.freezeServer(req, res); }
        if (mdl === 'delete')    { return me.deleteServer(req, res); }
        if (mdl === 'closeErrors') { return me.closeErrors(req, res); }
        if (mdl === 'clearErrors') { return me.clearErrors(req, res); }

        Gd.fai(res);
    });

    Gd.getPost(fty, '/view', async (req, res) => {
        let mdl = req.pms['mdl'];

        if (mdl === 'cur_servers')   { return me.curServers(req, res); }
        if (mdl === 'get_history')   { return me.getHistory(req, res); }
        if (mdl === 'get_net_group') { return me.getNetGroup(req, res); }
        if (mdl === 'get_err_logs')  { return me.getErrLogs(req, res); }

        Gd.fai(res);
    });
};

let me = {
    editServer: function(req, res) {
        let ip = (req.pms['ip'] || '').toLowerCase();
        let group = req.pms['group'] || '';
        let name = req.pms['name'] || '';
        if (!ip || !group || !name) { return Gd.fai('信息不全。'); }

        W32501.hset(Cst.fix.n_snt_servers, ip, JSON.stringify([group, name, 0]), Gd.render(res));
    },

    freezeServer: function(req, res) {
        let ip = (req.pms['id'] || '').trim().toLowerCase();
        W32501.hget(Cst.fix.n_snt_servers, ip, function(err, ret) {
            ret = JSON.parse(ret || '[]');
            if (ret[2] === 1) { ret[2] = 0; }
            else { ret[2] = 1; }

            W32501.hset(Cst.fix.n_snt_servers, ip, JSON.stringify(ret), Gd.render(res));
        });
    },

    deleteServer: function(req, res) {
        let ip = (req.pms['ip'] || '').trim().toLowerCase();
        let keys = "n_snt_*{{0}}*".format([ip]);
        W32501.keys(keys, function(err, rets) {
            Gd.forEach(rets, function(idx, key) {
                W32501.del(key);
            });
            if (req.pms['just_history']) {
                Gd.suc(res);
            } else {
                W32501.hdel(Cst.fix.n_snt_servers, ip, Gd.render(res));
            }
        });
    },

    closeErrors: function(req, res) {
        let ip = (req.pms['ip'] || '').trim().toLowerCase();
        W32501.hset(Cst.fix.n_snt_cur + ip, 'warn', 0, function(err, ret) {
            W32501.hset(Cst.fix.n_snt_cur + ip, 'error', 0, Gd.render(res));
        });
    },

    clearErrors: function(req, res) {
        let ip = (req.pms['ip'] || '').trim().toLowerCase();
        W32501.del(Cst.fix.n_snt_err_log + ip, Gd.render(res));
    },

    getHistory: function(req, res) {
        let ip = (req.pms['ip'] || '').trim().toLowerCase();
        let type = (req.pms['type'] || '').trim().toLowerCase();
        let days = parseFloat(req.pms['days']) || 1;
        let start = new Date().dayAdd(-days).format('yyMMddhhmm');

        let dKey = Cst.fix['n_snt_ana_' + type] + ip;
        W32501.zrangebyscore(dKey, start, '9901010000', function(err, ret) {
            Gd.renderRedis(res, err, ret);
        });
    },
    getNetGroup: function(req, res) {
        let days = parseFloat(req.pms['days']) || 1;
        let start = new Date().dayAdd(-days).format('yyMMddhhmm');

        let ret = {'133': [], '134': []};
        W32501.zrangebyscore(Cst.fix.n_snt_ana_net_group + '133', start, '9901010000', function(err1, re133) {
            ret['133'] = re133;

            W32501.zrangebyscore(Cst.fix.n_snt_ana_net_group + '134', start, '9901010000', function(err2, re134) {
                ret['134'] = re134;
                Gd.renderRedis(res, err2, ret);
            });
        });
    },

    getErrLogs: function(req, res) {
        let ip = (req.pms['ip'] || '').trim().toLowerCase();

        W32501.zrevrange(Cst.fix.n_snt_err_log + ip, 0, 500, function(err, re) {
            let ret = {pg: 1, pgSize: 500, records: []};
            Gd.forEach(re, function(idx, item) {
                ret.records.push({ip: ip, msg: item });
            });
            Gd.suc(res, ret);
        });
    },

    curServers: function(req, res) {
        let ret = {pg: 1, pgSize: 1000, records: []};

        W32501.hgetall(Cst.fix.n_snt_servers, function(err, pcs) {
            let ips = Gd.getKeys(pcs);
            let ct = 0;
            Asy.whilst(
                function () { return ct < ips.length; },
                function (cb) {
                    let ip = ips[ct++];
                    let arr = pcs[ip];

                    let record = {ip: ip};
                    arr = JSON.parse(arr || '[]');
                    record['group'] = arr[0];
                    record['name'] = arr[1];
                    record['status'] = arr[2];

                    W32501.hgetall(Cst.fix.n_snt_cur + ip, function(err, val) {
                        Gd.apply(record, me.genOneRecord(val));
                        ret.records.push(record);
                        cb();
                    });
                },
                function() {
                    // 对 ret.records 排序
                    ret.records.sort(function(a, b) {
                        return (a.group+a.name+a.ip < b.group+b.name+b.ip) ? -1 : 1;
                    });
                    Gd.suc(res, ret);
                }
            );
        });
    },
    genOneRecord: function(v) {
        let rc = {
            warn: v.warn || 0,
            error: v.error || 0
        };
        if (v.cpu) {
            v.cpu = JSON.parse(v.cpu);
            rc.cpuBase = v.cpu[0].join(' X ');
            rc.cpuUse = v.cpu[1][1];
        }
        if (v.mem) {
            v.mem = JSON.parse(v.mem);
            rc.memTotal = v.mem[0][0];
            rc.memUse = v.mem[1][0];
        }
        if (v.disk) {
            v.disk = JSON.parse(v.disk);
            rc.dskBase = v.disk[2] || [];
            rc.diskTotal = v.disk[0][0];
            rc.diskUse = v.disk[1][1];
        }
        if (v.net) {
            v.net = JSON.parse(v.net);
            rc.netBase = v.net[0];
            rc.wanRX = v.net[1][0];
            rc.wanTX = v.net[1][1];
            rc.lanRX = v.net[1][2];
            rc.lanTX = v.net[1][3];
        }
        if (v.stamp) {
            rc.stamp = new Date(JSON.parse(v.stamp)[0]);
        }

        return rc;
    }
}

