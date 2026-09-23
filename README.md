# Pokerlingo

> Đánh bại nhà cái, làm chủ xác suất.  
> Gia đình êm ấm, vợ chồng hạnh phúc.  
> Bạn hời, người thân bạn hời.

Pokerlingo là nền tảng giáo dục về poker, blackjack và xác suất/EV — không phải công cụ hỗ trợ chơi theo thời gian thực hay sản phẩm cá cược.

## Platform foundation

- Next.js App Router + TypeScript strict
- PostgreSQL + Drizzle migrations
- Auth.js: GitHub, Google và magic link qua Resend
- Session, profile và audit log
- API nền: `/api/health`, `/api/me`, `/api/profile`
- request ID, origin validation, rate-limit abstraction, structured audit event
- GitHub Actions CI + cấu hình Vercel

## Chạy local

```bash
corepack enable
pnpm install
cp .env.example .env
# điền DATABASE_URL và AUTH_SECRET
pnpm db:migrate
pnpm dev
```

Mở http://localhost:3000. Để bật đăng nhập, thêm OAuth variables hoặc Resend variables trong `.env`.

## Quy ước cho team

Các DTO chung nằm trong `packages/contracts`; không đổi contract hoặc tự tạo migration ở feature branch. Xem [platform handoff](docs/platform-handoff.md) trước khi bắt đầu phần B/C/D.

## Deploy Vercel

Import repository, đặt **Root Directory** là `apps/web`, sau đó tạo biến môi trường riêng cho Development, Preview và Production. Preview/Production phải dùng database URL khác nhau. Chạy migration một lần qua CI được bảo vệ hoặc terminal của operator — không chạy migration trong Vercel Build Step.