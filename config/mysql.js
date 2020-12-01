let init = Gd.conn.connMysql2;

var MysqlDB;
module.exports = function(key) {
    if (key === 'app') {
        // Gd.global('MysqlDB', init(Env.mysql_db_cnf));
    }
};
