const webpack = require('webpack');
const configs = require('./webpack.config');

configs.forEach(d => d.mode = 'development');

webpack(configs).watch({
    aggregateTimeout: 300
}, (err, stats) => {
    console.log(stats.toString('minimal'));
});