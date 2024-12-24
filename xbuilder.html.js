const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chokidar = require('chokidar');
const config = require('./xbuilder.config');

// Khởi tạo cây phụ thuộc
let dependencyTree = {};

// Hàm đệ quy để thay thế nội dung của các file include
function replaceIncludes(content, basePath) {
  return content.replace(/<!--\s*include:(.*?)\s*-->/g, (match, includePath) => {
    const fullPath = path.resolve(basePath, includePath.trim());
    if (fs.existsSync(fullPath)) {
      const includedContent = fs.readFileSync(fullPath, 'utf8');
      return replaceIncludes(includedContent, path.dirname(fullPath)); // Đệ quy để xử lý các include lồng nhau
    }
    return match; // Trả về nguyên dạng nếu không tìm thấy file include
  });
}

// Hàm để render HTML và xử lý các include
function renderHTML(htmlPath) {
  const relativePath = path.relative(config.paths.src, htmlPath);
  const htmlOutputPath = path.join(config.paths.dist, relativePath);

  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  htmlContent = replaceIncludes(htmlContent, path.dirname(htmlPath));

  // Tạo thư mục chứa file HTML đầu ra nếu chưa tồn tại
  fs.mkdirSync(path.dirname(htmlOutputPath), { recursive: true });
  fs.writeFileSync(htmlOutputPath, htmlContent);
  const tmp_sourcePath = path.relative(process.cwd(), htmlPath);
  const tmp_distPath = path.relative(process.cwd(), htmlOutputPath);
  console.log(`Render ${tmp_sourcePath} to ${tmp_distPath}`);
}

// Hàm để xây dựng cây phụ thuộc giữa các file HTML
function buildDependencyTree() {
  const allHtmlFiles = glob.sync(`${config.paths.src}/**/*.html`);
  dependencyTree = {}; // Khởi tạo lại cây phụ thuộc

  allHtmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const includes = [...content.matchAll(/<!--\s*include:\s*(.*?)\s*-->/g)];

    includes.forEach((match) => {
      const includedFilePath = path.resolve(path.dirname(file), match[1].trim());
      if (!dependencyTree[includedFilePath]) {
        dependencyTree[includedFilePath] = [];
      }
      dependencyTree[includedFilePath].push(file); // Thêm file cha vào cây phụ thuộc
    });
  });
}

// Hàm để render lại tất cả các file HTML cha có include file HTML thay đổi
function renderAffectedFiles(htmlPath) {
  renderHTML(htmlPath); // Render lại file HTML đã thay đổi

  // Render lại các file cha có include file này
  const parentFiles = dependencyTree[htmlPath] || [];
  parentFiles.forEach(renderHTML);
}

// Hàm để theo dõi sự thay đổi của các file HTML và chỉ render lại các file cần thiết
function watchHtmlFiles() {
  // Xây dựng cây phụ thuộc ban đầu
  buildDependencyTree();

  chokidar.watch(`${config.paths.src}/**/*.html`, {
    usePolling: true,
    interval: 100, // khoảng thời gian giữa các lần polling
  }).on('change', htmlPath => {
    //console.log(`File changed: ${htmlPath}`);
    renderAffectedFiles(htmlPath); // Render lại file thay đổi và các file cha phụ thuộc
  });
}

// Hàm build tất cả các file HTML và xử lý include cha
function buildAllHTML() {
  // Xây dựng cây phụ thuộc ban đầu
  buildDependencyTree();

  const htmlFiles = glob.sync(`${config.paths.src}/**/*.html`);

  htmlFiles.forEach(htmlFile => {
    renderHTML(htmlFile); // Render mỗi file HTML
    const parentFiles = dependencyTree[htmlFile] || []; // Tìm file cha có include nó
    parentFiles.forEach(renderHTML); // Render lại các file cha
  });
}

// Kiểm tra tham số dòng lệnh để xác định chế độ hoạt động
if (process.argv.includes('--watch')) {
  watchHtmlFiles(); // Chạy chế độ watch nếu có tham số --watch
} else {
  buildAllHTML(); // Mặc định chạy build toàn bộ
}
