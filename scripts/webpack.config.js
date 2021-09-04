const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const mainConfig = {
    target: 'electron-main',
    externals: {
        // the vscode-module is created on-the-fly and must be excluded.
        // Add other modules that cannot be webpack'ed,
        // 📖 -> https://webpack.js.org/configuration/externals/
        vscode: 'commonjs vscode'
    },
    entry: {
        extension: path.join(__dirname, '../src/extension'),
    },
    output: {
        libraryTarget: "commonjs2",
        path: path.join(__dirname, '../dist'),
        filename: '[name].js'
    },
    plugins: [
        new CleanWebpackPlugin(),
    ],
};

const rendererConfig = {
    target: 'electron-renderer',
    entry: {
        note: path.join(__dirname, '../src/renderer/note'),
        notebook: path.join(__dirname, '../src/renderer/notebook'),
    },
    output: {
        publicPath: '',
        path: path.join(__dirname, '../dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-react'
                    ]
                }
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test:/\.(woff|woff2|eot|otf|ttf|svg)$/,
                use:'file-loader'
            }
        ],
    },
    resolve: {
        alias: {
            vue: 'vue/dist/vue.esm-bundler.js',
        },
    },
    plugins: [
        new MiniCssExtractPlugin(),
    ]
};

module.exports = [mainConfig, rendererConfig];
