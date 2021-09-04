const webpack = require('webpack');
const configs = require('./webpack.config');

configs.forEach(d => d.mode = 'production');

const compiler = webpack(configs);

compiler.run((err, stats) => {
    if (err) {
        console.error(err.stack || err);
        if (err.details) {
            console.error(err.details);
        }
        return;
    }
    
    console.log(stats.toString('normal'));
});