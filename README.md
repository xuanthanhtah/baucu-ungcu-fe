# React + Tailwind + Ant Design

Một scaffold nhỏ để bắt đầu phát triển ứng dụng React với Tailwind CSS và Ant Design (AntD).

Yêu cầu:

- Node.js >= 16

Hướng dẫn (PowerShell - pwsh.exe):

1. Cài đặt dependencies

```powershell
npm install
```

2. Chạy dev server

```powershell
npm run dev
```

3. Xây dựng

```powershell
npm run build
npm run preview
```

4. Kiểm tra kiểu TypeScript

```powershell
npm run type-check
```

Ghi chú thêm:

- Dự án đã được chuyển sang TypeScript. Các tệp nguồn chính bây giờ là `src/main.tsx` và `src/App.tsx`.
- Nếu bạn muốn tắt strict mode hoặc chỉnh `tsconfig.json`, sửa tệp `tsconfig.json` trong thư mục gốc.

Ghi chú:

- Tailwind đã được cấu hình (tailwind.config.cjs và postcss.config.cjs). Tệp CSS nhập biểu tượng Tailwind ở `src/index.css`.
- Ant Design reset CSS được import trong `src/App.jsx` bằng `import 'antd/dist/reset.css'` (AntD v5+).
- Nếu bạn muốn dùng TypeScript hoặc tùy biến theme AntD, tôi có thể giúp thêm.
