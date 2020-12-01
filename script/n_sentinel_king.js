require('../node_lib/tl');
var Cst = Gd.global('Cst', require('../config/const'));
var Env = Gd.global('Env', require('../config/env'));

require('../config/redis')('king');
require('../node_lib/conn/sms')(Env.sms_config);
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
var LogType = { error: 'error', warn: 'warn' };
var url_lan = "http://{{0}}:49119/all?access_key=" + Utl.getSha1(Env.fix.myIP_LAN, Env.fix.secret);
var url_wan = "http://{{0}}:49119/all?access_key=" + Utl.getSha1(Env.fix.myIP_WAN, Env.fix.secret);

var TIMEOUT_STEP;
function loop() {
    Log.newLine('++++++++++++++++++++++++++++++');
    // 检查每台服务器
    checkEachServer();
    // 汇总各网段带宽
    caleNetGroup();

    var now = new Date();
    if (now.getSeconds() > 50) {
        TIMEOUT_STEP = 59000;
    } else {
        TIMEOUT_STEP = 59980;
    }
    setTimeout(loop, TIMEOUT_STEP);
}
setTimeout(loop, 10*1000);

function checkEachServer() {
    W32501.hgetall(Cst.fix.n_snt_servers, function(err, servers) {
        Utl.forEach(servers, function(ip, val) {
            if (ip.indexOf('.') <= 0) { return; }
            val = JSON.parse(val || '[]');
            if (val[2] !== 0) { return; }

            // 内网直接请求
            if (/^(10.)|(192.)|(172.)/.test(ip)) {
                return Utl.webReqJson({
                    url: url_lan.format([ip]),
                    cb: function(err, ret) {
                        parse_server_status(err, ret, ip);
                    }
                });
            }
            // 外网用代理
            Utl.webAgentJson({
                agent: Env.fix.agent,
                url: url_wan.format([ip]),
                cb: function(err, ret) {
                    parse_server_status(err, ret, ip);
                }
            });
        });
    });
}
var Pcs = {};
function parse_server_status(err, ret, ip) {
    // 初始化内存变量
    if (Pcs[ip] === undefined) { Pcs[ip] = { errorCt: 0, eventCt: 0, parseCt: 0 }; }
    Pcs[ip].parseCt++;

    if (ret.status == 'fai') { err =  ret.msg || 'return fai.'; }
    if (err) {
        Pcs[ip].errorCt += 1;

        // 连续3次出现错误，标记服务器出错状态
        addPcEvent(ip, (Pcs[ip].errorCt >= 3 ? LogType.error : LogType.warn), ['Lost', err]);
    } else { Pcs[ip].errorCt = 0; }

    if (err) {
        Log.log(ip + ' -> ' + err);
    } else {
        save_cur_info(ip, ret);
    }
}
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// 返回的结果
// cpu      [ [ 2, '2.00GHz' ],         [ 1, 1 ],               [ 1, 1 ] ]
// mem      [ [ 8000, 7843 ],           [ 16 ],                 [ 6470, 173, 1200 ] ]
// disk     [ [ 278, 272 ],             [ 2, 6 ],               [ [ '/', 69, 65, 6 ], [ '/home', 209, 207, 1 ] ] ]
// net      [ [ [Object], [Object] ],   [ 0, 0, 10.95, 12.0],   [ [ 'eth0', 584781, 17417 ], [ 'eth1', 937082, 4624 ] ] ]
// notice   []
// stamp    [1494485609757, 88]
function save_cur_info(ip, ret) {
    Log.log(ip + ' -> ' + JSON.stringify(ret.notice));
    //console.log(JSON.stringify(ret));

    // pc 基本信息
    var Last        = Pcs[ip];
    var pcBase      = [];
    var now         = new Date();
    var timeScore   = parseInt(now.format('yyMMddhhmm'));

    var pcKey       = Cst.fix.n_snt_cur + ip;
    var pcAnaCpu    = Cst.fix.n_snt_ana_cpu + ip;
    var pcAnaMem    = Cst.fix.n_snt_ana_mem + ip;
    var pcAnaDsk    = Cst.fix.n_snt_ana_dsk + ip;
    var pcAnaNet    = Cst.fix.n_snt_ana_net + ip;

    if (ret.stamp) {
        W32501.hset(pcKey, 'stamp', JSON.stringify(ret.stamp));
    }

    var cpu = ret.cpu || [];
    if (cpu.length > 0) {
        pcBase.push(cpu[0]);
        W32501.hset(pcKey, 'cpu', JSON.stringify([cpu[0], cpu[1]]));
        if (!Last.cpu || Last.cpu[0] !== cpu[1][0] || Last.cpu[1] !== cpu[1][1]) {
            Last.cpu = cpu[1];
            W32501.zadd(pcAnaCpu, timeScore, JSON.stringify([timeScore, cpu[1]]));
        }
        if (cpu[1][1] > 95) { addPcEvent(ip, LogType.warn, ['Cpu', cpu[2]]); }
    }

    var mem = ret.mem || [];
    if (mem.length > 0) {
        pcBase.push([mem[0][0]]);
        W32501.hset(pcKey, 'mem', JSON.stringify([mem[0], mem[1]]));
        if (Last.mem !== mem[1][0] || (Last.parseCt % 10 === 0)) {
            Last.mem = mem[1][0];
            W32501.zadd(pcAnaMem, timeScore, JSON.stringify([timeScore, mem[1]]));
        }
        if (mem[1][0] > 85) { addPcEvent(ip, LogType.warn, ['Mem', mem[1]]); }
    }

    var disk = ret.disk || [];
    if (disk.length > 0) {
        pcBase.push([disk[0][0]]);
        W32501.hset(pcKey, 'disk', JSON.stringify([disk[0], disk[1], disk[2]]));
        if (!Last.disk || Last.disk[0] !== disk[1][0] || Last.disk[1] !== disk[1][1]) {
            Last.disk = disk[1];
            W32501.zadd(pcAnaDsk, timeScore, JSON.stringify([timeScore, disk[1]]));
        }
        var parts = disk[2];
        Utl.forEach(parts, function(idx, part) {
            // 10G的剩余空间都没有了
            if (part[2] < 10) { addPcEvent(ip, LogType.warn, ['Disk', disk[2]]); }
        });
    }

    var net = ret.net || [];
    if (net.length > 0) {
        pcBase.push(net[0]);
        W32501.hset(pcKey, 'net', JSON.stringify([net[0], net[1]]));
        W32501.zadd(pcAnaNet, timeScore, JSON.stringify([timeScore, toMbps(net[1])]));
    }

    var notice = ret.notice || [];
    if (notice.length > 0) {
        addPcEvent(ip, LogType.error, ['Notice', notice]);
    }

    // 服务器基本配置发生变化，通知管理员
    if (pcBase.length >= 4) {
        W32501.hget(pcKey, 'base', function(err, lastBase) {
            var curBase = JSON.stringify(pcBase);
            if (curBase !== lastBase) {
                W32501.hset(pcKey, 'base', curBase);
                if (lastBase) { addPcEvent(ip, LogType.error, ['Base', lastBase]); }
            }
        });
    }

    // 删除30天前的历史数据(每天凌晨5点执行)
    if (now.getHours() === 5 && now.getMinutes() <= 6) {
        Log.log('Del: ' + ip);
        var score =  parseInt(now.dayAdd(-30).format('yyMMddhhmm'));
        W32501.zremrangebyscore(pcAnaCpu, 0, score);
        W32501.zremrangebyscore(pcAnaMem, 0, score);
        W32501.zremrangebyscore(pcAnaDsk, 0, score);
        W32501.zremrangebyscore(pcAnaNet, 0, score);

        // +++++++++++++++++++++++++++++++++++++++
        // 删除网络汇总数据
        var group133 = Cst.fix.n_snt_ana_net_group + '133';
        var group134 = Cst.fix.n_snt_ana_net_group + '134';
        var groupAll = Cst.fix.n_snt_ana_net_group + 'all';
        W32501.zremrangebyscore(group133, 0, score);
        W32501.zremrangebyscore(group134, 0, score);
        W41502.zremrangebyscore(groupAll, 0, score);
        // +++++++++++++++++++++++++++++++++++++++
    }
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// 前一分钟网段统计
function caleNetGroup() {
    W32501.hgetall(Cst.fix.n_snt_servers, function(err, servers) {
        var now = new Date();
        var last1Min = parseInt(new Date(now -   60*1000).format('yyMMddhhmm'));
        var last2Min = parseInt(new Date(now - 2*60*1000).format('yyMMddhhmm'));
        var last9Min = parseInt(new Date(now - 9*60*1000).format('yyMMddhhmm'));
        var ret = { '133': {}, '134': {} };
        // wanRX, wanTX, lanRX, lanTX
        ret['133'][last1Min] = [0, 0, 0, 0];
        ret['133'][last2Min] = [0, 0, 0, 0];
        ret['133'][last9Min] = [0, 0, 0, 0];
        ret['134'][last1Min] = [0, 0, 0, 0];
        ret['134'][last2Min] = [0, 0, 0, 0];
        ret['134'][last9Min] = [0, 0, 0, 0];

        var ips = Utl.getKeys(servers);
        var ct = 0;
        Asy.whilst(
            function () { return ct < ips.length; },
            function (cb) {
                var ip = ips[ct++];
                var val = servers[ip];
                val = JSON.parse(val || '[]');

                var group = val[0];
                if (group !== '133' && group !== '134') { return cb(); }

                var pcAnaNet = Cst.fix.n_snt_ana_net + ip;
                W32501.zrangebyscore(pcAnaNet, last9Min, '9901010000', function(err, nets) {
                    var net9 = JSON.parse(nets[0] || '[]');
                    var net2 = JSON.parse(nets[7] || '[]');
                    var net1 = JSON.parse(nets[8] || '[]');

                    var cc;
                    if (net9[0] === last9Min) { cc = ret[group][last9Min]; cc[0] += net9[1][0]; cc[1] += net9[1][1]; }
                    if (net2[0] === last2Min) { cc = ret[group][last2Min]; cc[0] += net2[1][0]; cc[1] += net2[1][1]; }
                    if (net1[0] === last1Min) { cc = ret[group][last1Min]; cc[0] += net1[1][0]; cc[1] += net1[1][1]; }

                    cb();
                });
            },
            function() {
                var group133 = Cst.fix.n_snt_ana_net_group + '133';
                var group134 = Cst.fix.n_snt_ana_net_group + '134';

                var arr133Last1 = eachFixed2(ret['133'][last1Min]);
                var arr133Last2 = eachFixed2(ret['133'][last2Min]);
                var arr133Last9 = eachFixed2(ret['133'][last9Min]);

                var arr134Last1 = eachFixed2(ret['134'][last1Min]);
                var arr134Last2 = eachFixed2(ret['134'][last2Min]);
                var arr134Last9 = eachFixed2(ret['134'][last9Min]);

                W32501.multi()
                    .zremrangebyscore(group133, last1Min, last1Min)
                    .zadd(group133, last1Min, JSON.stringify([last1Min, arr133Last1]))
                    .zremrangebyscore(group133, last2Min, last2Min)
                    .zadd(group133, last2Min, JSON.stringify([last2Min, arr133Last2]))
                    .zremrangebyscore(group133, last9Min, last9Min)
                    .zadd(group133, last9Min, JSON.stringify([last9Min, arr133Last9]))

                    .zremrangebyscore(group134, last1Min, last1Min)
                    .zadd(group134, last1Min, JSON.stringify([last1Min, arr134Last1]))
                    .zremrangebyscore(group134, last2Min, last2Min)
                    .zadd(group134, last2Min, JSON.stringify([last2Min, arr134Last2]))
                    .zremrangebyscore(group134, last9Min, last9Min)
                    .zadd(group134, last9Min, JSON.stringify([last9Min, arr134Last9]))

                    .exec(function(err2, rets2) {
                        Log.log('Net group cale finished.');
                    });

                // add by cd.net on 20200401
                // ++++++++++++++++++++++++++++++++++++++++++++++++++++
                // 通知业务数据库，当前网络利用情况。
                var groupAll = Cst.fix.n_snt_ana_net_group + 'all';
                W41502.multi()
                    .zremrangebyscore(groupAll, last1Min, last1Min)
                    .zadd(groupAll, last1Min, JSON.stringify({time: last1Min, 133: arr133Last1, 134: arr134Last1}))
                    .zremrangebyscore(groupAll, last2Min, last2Min)
                    .zadd(groupAll, last2Min, JSON.stringify({time: last2Min, 133: arr133Last2, 134: arr134Last2}))
                    .exec(function(err3, ret3) {
                        Log.log('Send data to 41502 finished.');
                    });
                // ++++++++++++++++++++++++++++++++++++++++++++++++++++

                // add by cd.net on 20200717
                // ++++++++++++++++++++++++++++++++++++++++++++++++++++
                // 如果带宽使用超过 40Mb/50Mb 就要触发短信提醒管理员
                var wanRX133 = (arr133Last1[0] + arr133Last2[0]) / 2;
                var wanTX133 = (arr133Last1[1] + arr133Last2[1]) / 2;
                Log.log(`WanRX133: ${wanRX133.toFixed(2)}, WanTX133: ${wanTX133.toFixed(2)}`);

                if (wanRX133 > 43.5 || wanTX133 > 43.5) {
                    var flagKey = Cst.fix.n_snt_sms_notice_flag + '133WanWarn';
                    W32501.get(flagKey, function(err, ret) {
                        if (ret) return;
                        // 发短信，30分钟发一条短信
                        var message = `[${wanRX133.toFixed(2)},${wanTX133.toFixed(2)}]`;
                        W32501.setex(flagKey, 1800, message);
                        sendAdminNotice('133Wan', message);
                    });
                }
                // ++++++++++++++++++++++++++++++++++++++++++++++++++++
            }
        );
    });
}

function toMbps(arr) {
    Utl.forEach(arr, function(idx, it) {
        arr[idx] = parseFloat((it * 8 / 1024).toFixed(3));
    });
    return arr;
}
function eachFixed2(arr) {
    Utl.forEach(arr, function(idx, it) {
        arr[idx] = parseFloat(it.toFixed(2));
    });
    return arr;
}
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function addPcEvent(ip, type, value) {
    var pcKey   = Cst.fix.n_snt_cur + ip;
    W32501.hincrby(pcKey, type, 1);

    // 记录错误日志
    var Last = Pcs[ip];
    if (!Last.event || JSON.stringify(Last.event[2]) !== JSON.stringify(value) || Last.eventCt >= 9) {
        var logKey = Cst.fix.n_snt_err_log + ip;
        var curVal = [new Date().format(), type, value];
        W32501.zadd(logKey, Number(new Date(curVal[0])), JSON.stringify(curVal));
        if (Last.eventCt > 0 && Last.eventCt < 9) {
            W32501.zadd(logKey, Number(new Date(Last.event[0])), JSON.stringify(Last.event));
        }

        Last.eventCt = 0;
        Last.event = curVal;
    } else {
        Last.eventCt++;
    }

    // 需要检查发短信，通知管理员
    if (type == LogType.error) {
        var flagKey = Cst.fix.n_snt_sms_notice_flag + ip;
        W32501.get(flagKey, function(err, ret) {
            if (ret) { return; }

            // 发短信，每台服务器8个小时之内只发送一次短信。
            W32501.hgetall(pcKey, function(err, pcInfo) {
                var msg = '[' + pcInfo.warn + ',' + pcInfo.error + ']';
                W32501.setex(flagKey, 3600*8, msg);
                sendAdminNotice('[' + ip.replace('10.10.', '') + ']', msg);
            });
        });
    }
}

// 给管理员发送通知短信
function sendAdminNotice(name, code) {
    Sms.adminNotice('13800138000', name, code);
}
