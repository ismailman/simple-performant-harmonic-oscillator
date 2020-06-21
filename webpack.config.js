const path = require('path');

module.exports = {
    entry: './spho.js',
    mode: 'development',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'spho.js',
        library: 'spho',
        libraryTarget: 'umd'
    }
};