const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chokidar = require('chokidar');
const babel = require('@babel/core');
const terser = require('terser');
const config = require('./xbuilder.config');

// Khởi tạo cây phụ thuộc
let dependencyTree = {};

// Hàm để xây dựng cây phụ thuộc giữa các file JavaScript dựa trên import hoặc require
function buildDependencyTree() {
  const allJsFiles = glob.sync(`${config.paths.srcJS}/**/*.js`);
  dependencyTree = {}; // Khởi tạo lại cây phụ thuộc

  allJsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const importRegex = /(?:import|require)\(['"](.+?)['"]\)/g;
    const imports = [...content.matchAll(importRegex)];

    imports.forEach(match => {
      const importedFilePath = path.resolve(path.dirname(file), match[1].trim() + '.js');
      if (fs.existsSync(importedFilePath)) {
        if (!dependencyTree[importedFilePath]) {
          dependencyTree[importedFilePath] = [];
        }
        dependencyTree[importedFilePath].push(file); // Thêm file cha vào cây phụ thuộc
      }
    });
  });
}

// Hàm để build JavaScript với optional minify
async function buildJS(jsPath) {
  const relativePath = path.relative(config.paths.srcJS, jsPath);
  const jsOutputPath = path.join(config.paths.distJS, relativePath);

  try {
    // Sử dụng Babel để xử lý JavaScript
    let result = babel.transformFileSync(jsPath, {
      presets: ['@babel/preset-env'],
    });

    // Nếu isMinify được bật, nén (minify) mã JavaScript
    if (config.isMinJs) {
      const minified = await terser.minify(result.code);
      result.code = minified.code;
    }

    fs.mkdirSync(path.dirname(jsOutputPath), { recursive: true });
    fs.writeFileSync(jsOutputPath, result.code);

    // Tạo đường dẫn tương đối cho việc log
    const tmp_sourcePath = path.relative(process.cwd(), jsPath);
    const tmp_distPath = path.relative(process.cwd(), jsOutputPath);
    console.log(`Build ${tmp_sourcePath} to ${tmp_distPath}`);
  } catch (error) {
    console.error(`Failed to build ${jsOutputPath}`, error);
  }
}

// Hàm để build lại tất cả các file JavaScript cha có import file JavaScript thay đổi
function buildAffectedFiles(jsPath) {
  buildJS(jsPath); // Build lại file JS đã thay đổi

  // Build lại các file cha có import file này
  const parentFiles = dependencyTree[jsPath] || [];
  parentFiles.forEach(buildJS);
}

// Hàm để theo dõi sự thay đổi của các file JavaScript và chỉ build lại các file cần thiết
function watchJsFiles() {
  // Xây dựng cây phụ thuộc ban đầu
  buildDependencyTree();

  chokidar.watch(`${config.paths.srcJS}/**/*.js`, {
    usePolling: true,
    interval: 100, // khoảng thời gian giữa các lần polling
  }).on('change', jsPath => {
    buildAffectedFiles(jsPath); // Build lại file thay đổi và các file cha phụ thuộc
  });
}

// Hàm build tất cả các file JavaScript và xử lý import cha
function buildAllJS() {
  // Xây dựng cây phụ thuộc ban đầu
  buildDependencyTree();

  const jsFiles = glob.sync(`${config.paths.srcJS}/**/*.js`);
  jsFiles.forEach(jsFile => {
    buildJS(jsFile); // Build mỗi file JS
    const parentFiles = dependencyTree[jsFile] || []; // Tìm file cha có import nó
    parentFiles.forEach(buildJS); // Build lại các file cha
  });
}

// Kiểm tra tham số dòng lệnh để xác định chế độ hoạt động
if (process.argv.includes('--watch')) {
  watchJsFiles(); // Chạy chế độ watch nếu có tham số --watch
} else {
  buildAllJS(); // Mặc định chạy build toàn bộ
}
