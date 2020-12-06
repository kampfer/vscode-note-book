const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const compiler = webpack({
    mode: 'production',
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

compiler.run((err, stats) => {
    if (err) {
        console.error(err.stack || err);
        if (err.details) {
            console.error(err.details);
        }
        return;
    }
    
    console.log(stats.toJson('minimal'));
});