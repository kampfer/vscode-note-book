const webpack = require('webpack');
const config = Object.assign({ mode: 'production' }, require('./webpack.config.web'));

const compiler = webpack(config);

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