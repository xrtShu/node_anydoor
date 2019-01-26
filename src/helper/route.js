const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const promisify = require('util').promisify;
const fs_stat = promisify(fs.stat);
const fs_readdir = promisify(fs.readdir);
const conf = require('../config/default-config');

const tplPath = path.join(__dirname, '../template/dir.tpl');
// 同步读取，因为只执行一次，并且后面的代码依赖到它
const source = fs.readFileSync(tplPath);
const template = Handlebars.compile(source.toString());

module.exports = async function (req, res, filePath) {
    try {
        const stats = await fs_stat(filePath);
        if (stats.isFile()) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            fs.createReadStream(filePath).pipe(res);
        } else if (stats.isDirectory()) {
            const files = await fs_readdir(filePath);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            const dataSource = {
                title: path.basename(filePath),
                dir: path.relative(conf.root, filePath),
                files
            };
            res.end(template(dataSource));
        }
    } catch (ex) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`${filePath} is not a directory or file \n ${ex}`);
    }
};
