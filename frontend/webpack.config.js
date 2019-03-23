const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  output: {
    path: path.join(__dirname, 'public/assets/'),
    filename: 'app.js',
    publicPath: '/assets/',
  },
  plugins: [
    new Dotenv(),
  ],
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
  node: {
    fs: 'empty',
  },
};
