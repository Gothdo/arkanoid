import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const PHASER_PATH = path.join(__dirname, 'node_modules/phaser/build/custom');

export default {
  entry: './src/main.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
  },
  resolve: {
    alias: {
      pixi: path.join(PHASER_PATH, 'pixi.js'),
      p2: path.join(PHASER_PATH, 'p2.js'),
      phaser: path.join(PHASER_PATH, 'phaser-split.js'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          babelrc: false,
          presets: [
            ['env', {
              modules: false,
            }],
          ],
          plugins: ['transform-object-rest-spread'],
        },
      },
      {
        test: /(pixi|p2)\.js/,
        loader: 'script-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/index.html', inject: false }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 3000,
  },
};
