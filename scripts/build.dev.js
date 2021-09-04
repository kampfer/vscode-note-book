const webpack = require('webpack');
const configs = require('./webpack.config');

configs.forEach(d => d.mode = 'development');

configs[0].devtool = 'eval-source-map';

webpack(configs).watch({
    aggregateTimeout: 300
}, (err, stats) => {
    console.log(stats.toString('minimal'));
});