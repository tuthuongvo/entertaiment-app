const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const chokidar = require('chokidar');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const config = require('./xbuilder.config');

// Khởi tạo cây phụ thuộc
let dependencyTree = {};

// Hàm kiểm tra tệp tồn tại
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Hàm để hợp nhất các tệp @import trong CSS
async function resolveImports(cssContent, cssDir, visitedFiles = new Set()) {
  const importRegex = /@import\s+['"]([^'"]+)['"]\s*;?/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = importRegex.exec(cssContent)) !== null) {
    result += cssContent.slice(lastIndex, match.index);
    lastIndex = importRegex.lastIndex;

    const importPath = match[1];
    const fullImportPath = path.resolve(cssDir, importPath);

    if (visitedFiles.has(fullImportPath)) {
      console.warn(`Circular import detected: ${fullImportPath}`);
      continue;
    }

    if (await fileExists(fullImportPath)) {
      visitedFiles.add(fullImportPath);
      try {
        const importedContent = await fs.readFile(fullImportPath, 'utf8');
        const resolvedContent = await resolveImports(
          importedContent,
          path.dirname(fullImportPath),
          visitedFiles
        );
        result += resolvedContent;
      } catch (err) {
        console.error(`Error reading file: ${fullImportPath}`, err);
        result += match[0]; // Giữ nguyên @import nếu đọc tệp thất bại
      }
    } else {
      console.warn(`Imported file not found: ${fullImportPath}`);
      result += match[0]; // Giữ nguyên @import nếu tệp không tồn tại
    }
  }

  result += cssContent.slice(lastIndex);
  return result;
}

// Hàm để build CSS
async function buildCSS(cssPath) {
  const relativePath = path.relative(config.paths.srcCSS, cssPath);
  const cssOutputPath = path.join(config.paths.distCSS, relativePath);

  try {
    let css = await fs.readFile(cssPath, 'utf8');
    css = await resolveImports(css, path.dirname(cssPath));

    const plugins = [tailwindcss, autoprefixer];
    if (config.isMinCss) {
      plugins.push(cssnano({ preset: 'default' }));
    }

    const result = await postcss(plugins).process(css, {
      from: cssPath,
      to: cssOutputPath,
    });

    await fs.mkdir(path.dirname(cssOutputPath), { recursive: true });
    await fs.writeFile(cssOutputPath, result.css);

    // Tạo đường dẫn tương đối cho việc log
    const tmp_sourcePath = path.relative(process.cwd(), cssPath);
    const tmp_distPath = path.relative(process.cwd(), cssOutputPath);
    console.log(`Build ${tmp_sourcePath} to ${tmp_distPath}`);
  } catch (error) {
    console.error(`Failed to build ${cssPath}: ${error.message}`, error);
  }
}

// Hàm để xây dựng cây phụ thuộc giữa các tệp CSS dựa trên @import
async function buildDependencyTree() {
  const allCssFiles = glob.sync(`${config.paths.srcCSS}/**/*.css`);
  dependencyTree = {};

  await Promise.all(
    allCssFiles.map(async (file) => {
      try {
        const content = await fs.readFile(file, 'utf8');
        const imports = [...content.matchAll(/@import\s+['"]([^'"]+)['"]\s*;?/g)];

        imports.forEach((match) => {
          const importedFilePath = path.resolve(path.dirname(file), match[1].trim());
          if (!dependencyTree[importedFilePath]) {
            dependencyTree[importedFilePath] = [];
          }
          if (!dependencyTree[importedFilePath].includes(file)) {
            dependencyTree[importedFilePath].push(file);
          }
        });
      } catch (err) {
        console.error(`Error reading file: ${file}`, err);
      }
    })
  );
}

// Hàm để build lại tất cả các tệp CSS cha có @import tệp CSS thay đổi
async function buildAffectedFiles(cssPath) {
  await buildCSS(cssPath);

  // Build lại các tệp cha có @import tệp này
  const parentFiles = dependencyTree[cssPath] || [];
  for (const parentFile of parentFiles) {
    await buildCSS(parentFile);
  }
}

// Hàm để theo dõi sự thay đổi của các tệp CSS và chỉ build lại các tệp cần thiết
function watchCssFiles() {
  // Xây dựng cây phụ thuộc ban đầu
  buildDependencyTree();

  chokidar
    .watch(
      [
        `${config.paths.srcCSS}/**/*.css`,
        `${config.paths.srcCSS}/**/**/*.css`,
      ],
      {
        ignored: /node_modules/,
        persistent: true,
        ignoreInitial: false,
        followSymlinks: true,
        depth: 99,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100,
        },
      }
    )
    .on('change', (cssPath) => {
      buildAffectedFiles(cssPath); // Build lại tệp thay đổi và các tệp cha phụ thuộc
    })
    .on('add', (cssPath) => {
      buildDependencyTree();
      buildAffectedFiles(cssPath);
    })
    .on('unlink', (cssPath) => {
      buildDependencyTree();
      console.log(`File removed: ${cssPath}`);
    });
}

// Hàm build tất cả các tệp CSS và xử lý @import cha
async function buildAllCSS() {
  // Xây dựng cây phụ thuộc ban đầu
  await buildDependencyTree();

  const cssFiles = glob.sync(`${config.paths.srcCSS}/**/*.css`);
  for (const cssFile of cssFiles) {
    await buildCSS(cssFile); // Build mỗi tệp CSS
  }
}

// Kiểm tra tham số dòng lệnh để xác định chế độ hoạt động
if (process.argv.includes('--watch')) {
  watchCssFiles(); // Chạy chế độ watch nếu có tham số --watch
} else {
  buildAllCSS(); // Mặc định chạy build toàn bộ
}
