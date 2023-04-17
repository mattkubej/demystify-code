const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    popup: './src/popup/index.tsx',
    'service-worker': './src/service-worker/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'chrome-extension', 'dist'),
    filename: '[name].bundle.js',
    publicPath: 'dist',
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  performance: {
    hints: false,
  },
};
