const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const compiler = webpack({
    mode: 'development',
    entry: {
        note: path.join(__dirname, '../src/renderer/note'),
        notebook: path.join(__dirname, '../src/renderer/notebook')
    },
    output: {
        publicPath: '',
        path: path.join(__dirname, '../dist'),
        filename: '[name].js'
    },
    plugins: [new MiniCssExtractPlugin()],
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test:/\.(woff|woff2|eot|otf|ttf)$/,
                use:'file-loader'
            }
        ],
    },
});

const watching = compiler.watch({
    aggregateTimeout: 300,
    poll: undefined
}, (err, stats) => {
    if (err) {
        console.error(err.stack || err);
        if (err.details) {
            console.error(err.details);
        }
        return;
    }
    
    console.log(stats.toString());
});