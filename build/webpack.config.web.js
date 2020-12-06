const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: {
        note: path.join(__dirname, '../src/renderer/note'),
        notebook: path.join(__dirname, '../src/renderer/notebook')
    },
    output: {
        publicPath: '',
        path: path.join(__dirname, '../dist'),
        filename: '[name].js'
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new CleanWebpackPlugin(),
    ],
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
};