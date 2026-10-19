# Triển khai MatchMate lên Vercel (CI/CD với GitHub Actions)

Quy trình tự động sau khi cài đặt:

| Sự kiện | Việc chạy | Kết quả |
|---|---|---|
| Push lên bất kỳ nhánh nào hoặc mở PR | **Check**: cú pháp JS, link hỏng, icon thiếu, chuỗi EN/VI lệch nhau | ❌ Nếu lỗi thì dừng, không deploy |
| Mở hoặc cập nhật Pull Request | Check → **Deploy preview** | Bot bình luận link xem thử vào PR |
| Push lên `main` | Check → **Deploy production** | Trang chính thức được cập nhật |
| Bấm "Run workflow" trong tab Actions | Như push lên `main` | Deploy lại thủ công |

Các file liên quan: `.github/workflows/deploy.yml`, `vercel.json`, `.vercelignore`, `scripts/check.mjs`.

---

## Bước 1: Tạo repo GitHub riêng cho MatchMate

Thư mục `matchmate/` hiện đang nằm trong repo lớn `D:\Code test` (remote `wad-cart-starter`, chứa nhiều bài khác). Nên tách MatchMate ra một repo riêng để workflow nằm đúng ở gốc repo.

1. Vào https://github.com/new và tạo repo **trống** (không tick README), ví dụ `matchmate`.
2. Mở terminal **trong thư mục `matchmate`** và chạy:

```bash
git init -b main
```
```bash
git add .
```
```bash
git commit -m "MatchMate prototype with CI/CD"
```
```bash
git remote add origin https://github.com/<tài-khoản>/matchmate.git
```
```bash
git push -u origin main
```

> Lần push đầu, job **Deploy production** sẽ báo đỏ vì chưa có secrets. Đó là bình thường, làm tiếp Bước 2–3 rồi chạy lại.

## Bước 2: Tạo project Vercel và lấy ID

Chạy trong thư mục `matchmate`:

```bash
npx vercel@64 login
```
```bash
npx vercel@64 link
```

Khi được hỏi, chọn **Link to new project** và đặt tên `matchmate`. Lệnh này tạo file `.vercel/project.json` chứa:

- `orgId` → dùng làm **VERCEL_ORG_ID**
- `projectId` → dùng làm **VERCEL_PROJECT_ID**

(`.vercel/` đã nằm trong `.gitignore`, sẽ không bị đẩy lên GitHub.)

Tạo token tại https://vercel.com/account/tokens (scope: tài khoản của bạn, đặt thời hạn tuỳ ý) → đây là **VERCEL_TOKEN**.

## Bước 3: Thêm secrets vào GitHub

Vào repo → **Settings → Secrets and variables → Actions → New repository secret**, thêm 3 secret:

| Tên | Giá trị |
|---|---|
| `VERCEL_TOKEN` | token vừa tạo |
| `VERCEL_ORG_ID` | `orgId` trong `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` trong `.vercel/project.json` |

Sau đó vào tab **Actions → CI/CD · Vercel → Run workflow** để deploy lần đầu. Link production sẽ hiện trong phần tóm tắt của lần chạy, và ở mục **Environments → production** của repo.

## Bước 4 (khuyến nghị): Bảo vệ nhánh `main`

**Settings → Branches → Add rule** cho `main`, bật **Require status checks to pass** và chọn **Check**. Như vậy code lỗi không thể vào `main`, nên cũng không lên production.

---

## Lưu ý

- `vercel.json` đặt `"git": { "deploymentEnabled": false }`. Nếu sau này bạn kết nối repo với Vercel qua giao diện web, Vercel sẽ **không** tự deploy thêm lần nữa, nên không bị deploy trùng với GitHub Actions.
- Chỉ trang web được upload: `.vercelignore` loại `scripts/`, `.github/`, `README.md`, `DEPLOY.md`, `package.json`.
- Kiểm tra trước khi push: `npm run check`
- Chạy thử trên máy: `npm run dev`, rồi mở http://localhost:5173
- PR mở từ fork sẽ chỉ chạy Check, không deploy preview, vì GitHub không cấp secrets cho fork.
