const path = require("path");

module.exports = {
  isMinCss: false,
  isMinJs: true,
  paths: {
    src: path.resolve(__dirname, "src"),
    srcCSS: path.resolve(__dirname, "src/css"),
    srcJS: path.resolve(__dirname, "src/js"), // Thư mục nguồn JavaScript
    dist: path.resolve(__dirname, "public"),
    distCSS: path.resolve(__dirname, "public/css"),
    distJS: path.resolve(__dirname, "public/js"), // Thư mục đích JavaScript
  },
};
