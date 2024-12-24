Cấu Trúc Dự Án

public/

- css/
- js/
- index.html
  src/
- components/ các thành phần dùng lại như footer.html, header.html, sidebar.html...
- css/
  ---- components/ các thành phần css dùng lại như header.css, footer.css, typography.css, forms.css...
  ---- campaign.css, index.css, login.css (các file tương ứng các pages .html)
- js/
  ---- jfast.1.1.3.js thư viện thay thế jquery tối ưu Pagespeed
  ---- campaign.js các js đi theo pages .html
- index.html
- campaign.html
- login.html
  ... các pages html

\*\*\* Các lệnh thường dùng:
Tải dự án về rồi chạy:

1. npm install (khởi tạo các thư viện cần thiết)
2. npm run build : Build html css js ra thư mục public để dùng.
3. npm run start : Chế độ builder & watch sự thay đổi, auto build ra public để ae vừa dev vừa test.

**_ Các pages chính như index.html, login.html, campaign.html nếu dùng chung header, footer, sidebar... ae dùng lệnh: <!-- include:components/header.html --> để truyền gọi các thành phần vào đỡ phải code lại và script nó trông gọn gàng, dễ dàng build các thành phần ra bên ngoài để cắt layout.
_** Để tắt MINIFY css, js thì mở file xbuilder.config.js chỉnh về false 2 biến này: isMinCss: true, isMinJs: true,
\*\*\* Chỉ tập trung code ở trong src, không cần quan tâm các thành phần khác.
