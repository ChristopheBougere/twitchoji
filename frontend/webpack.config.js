const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  output: {
    path: path.join(__dirname, 'public/assets/'),
    filename: 'app.js',
    publicPath: '/assets/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'react-svg-loader',
            options: {
              jsx: true, // true outputs JSX tags
            },
          },
        ],
      },
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    port: 9000,
  },
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          dead_code: true,
          unused: true,
          side_effects: true,
          warnings: false,
        },
        mangle: false,
        output: {
          beautify: true,
        },
      },
      sourceMap: true,
    }),
  ],
  node: {
   fs: 'empty',
  },
};
