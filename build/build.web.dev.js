const webpack = require('webpack');
const config = Object.assign({ mode: 'development' }, require('./webpack.config.web'));

const compiler = webpack(config);

compiler.watch({
    aggregateTimeout: 300
}, (err, stats) => {
    if (err) {
        console.error(err.stack || err);
        if (err.details) {
            console.error(err.details);
        }
        return;
    }
    
    console.log(stats.toString('normal'));
});