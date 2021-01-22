const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const OptimizeCssAssetWebpackPlugin = require("optimize-css-assets-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const ImageminPlugin = require("imagemin-webpack");

const optimization = () => {
  const configObj = {
    splitChunks: {
      chunks: "all",
    },
  };

  // TODO Исправить ошибку с подключением карты сайта
  if (isProd) {
    configObj.minimizer = [
      new OptimizeCssAssetWebpackPlugin(),
      new TerserWebpackPlugin(),
    ];
  }

  return configObj;
};

const isDev = process.env.NODE_ENV === "development";
const isProd = !isDev;

const getFiles = (dir, fileType) => {
  return dir.map((folder) => {
    const folderPath = `${PAGES_DIR}/${folder}`;
    const folderFiles = fs.readdirSync(folderPath);
    const pageFile = folderFiles.find((fileName) =>
      fileName.endsWith(`.${fileType}`)
    );
    return pageFile;
  });
};

const PATHS = {
  src: path.resolve(__dirname, "src"),
  dist: path.resolve(__dirname, "dist"),
  assets: "assets/",
};

const PAGES_DIR = `${PATHS.src}/pages`;
const PAGE_FOLDERS = fs.readdirSync(PAGES_DIR);
const PAGES = getFiles(PAGE_FOLDERS, "pug");
const ENTRY_FILES = getFiles(PAGE_FOLDERS, "js");

const ENTRYS = {};

ENTRY_FILES.forEach((entryFile, index) => {
  const fileName = entryFile.split(".")[0];
  ENTRYS[fileName] = `${PAGES_DIR}/${PAGE_FOLDERS[index]}/${entryFile}`;
});

const plugins = () => {
  const basePlugins = [
    new MiniCssExtractPlugin({
      filename: `${filename("css")}`,
    }),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: PATHS.assets,
          to: PATHS.dist + "/assets",
        },
      ],
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
    }),
    ...PAGES.map(
      (page, index) =>
        new HtmlWebpackPlugin({
          template: `${PAGES_DIR}/${PAGE_FOLDERS[index]}/${page}`,
          filename: `./${page.replace(/\.pug/, ".html")}`,
        })
    ),
  ];
  return basePlugins;
};

const filename = (ext) =>
  isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;

module.exports = {
  context: PATHS.src,
  entry: ENTRYS,
  output: {
    path: PATHS.dist,
    filename: `./assets/js/${filename("js")}`,
    publicPath: "",
  },
  devServer: {
    contentBase: PATHS.src,
    port: 9000,
    open: true,
  },
  optimization: optimization(),
  devtool: isProd ? false : "source-map",
  module: {
    rules: [
      // JavaScript
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      //CSS
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      //Sass
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, "./postscss.config.js"),
              },
              sourceMap: true,
            },
          },
          "sass-loader",
        ],
      },
      // изображения
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
        type: "asset/resource",
      },
      // шрифты и SVG
      {
        test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
        type: "asset/inline",
      },
      {
        test: /\.pug$/,
        loader: "pug-loader",
      },
    ],
  },
  plugins: plugins(),
};
