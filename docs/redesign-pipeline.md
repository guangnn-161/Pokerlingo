# Pokerlingo redesign — pipeline và điểm tiếp tục

Cập nhật: 2026-09-29. Đây là tài liệu bàn giao công việc, không phải xác nhận tất cả tính năng đã hoàn thành.

## Yêu cầu đã chốt

- Thiết kế lại Pokerlingo với bàn poker và blackjack ảo có tương tác; trang kiến thức toán học cho cả hai môn.
- Tham khảo cấu trúc luyện tập của https://app.pokertrainer.se/lobby và https://blackjack-trainer.net/; không sao chép nội dung/UI.
- Giao diện sản phẩm bằng tiếng Anh, theo yêu cầu đã chốt trong chat trước. Trao đổi với người dùng bằng tiếng Việt.
- Học qua quyết định và phản hồi ngay; giữ rõ giả định tính EV, ruleset và giới hạn của mô hình.
- Chia việc thành chặng nhỏ, mỗi chặng chạy được và có checkpoint. Cập nhật tài liệu này trước khi dừng.

## Các chat đã đọc

1. `Xây dựng platform` — 6ab400bc-17fc-83ec-85b8-2831a0bdf49f.
2. `Quy trình xây dựng web poker` — 6ab3d046-79a0-83ec-935b-276b22781e98.

Bản trước: /demo có một tình huống preflop, feedback/EV dạng fixture. Math engine đã có API nhưng chưa có UI. Roadmap cũ có auth, XP, nhiệm vụ, bạn bè, leaderboard và nhiều biến thể poker. Không trình bày dữ liệu mock là dữ liệu thật; giữ auth/API hiện có. Những phần roadmap ngoài yêu cầu hiện tại không phải điều kiện hoàn thành redesign này.

## Mã nguồn và bảo toàn dữ liệu

- GitHub: https://github.com/guangnn-161/Pokerlingo
- Production hiện hữu: https://pokerlingo-wheat.vercel.app
- Checkout gốc: `D:\Pokerlingo` (có thay đổi chưa commit của người dùng; không reset/clean/ghi đè).
- Checkout làm việc: `C:\Users\Guang\Documents\Codex\2026-09-29\https-github-com-worldflowai-everything-claude\work\pokerlingo`
- Branch: `codex/pokerlingo-trainers`, base `8181ed4` từ `origin/main`.
- Worktree tạo bằng Git vì công cụ managed worktree trả `Not a git repository` cho chat projectless này.
- Chưa push, chưa deploy bản thiết kế mới.
- Stack: pnpm 9.15.4 workspace, Next.js 15, React 19; packages/contracts, packages/db, packages/math.
- Không chuyển dự án sang Sites; tiếp tục kiến trúc Vercel hiện có.
- Bản `.env` cục bộ của checkout gốc không được sao chép hay in nội dung.

## Pipeline theo chặng

### 1. Sảnh và khung giao diện — ĐANG LÀM

- [x] Đọc hai chat cũ, tìm repo và cập nhật remote refs.
- [x] Tạo checkout riêng từ main mới nhất.
- [x] Tạo AppShell, PlayingCard, Chips và bộ lưu tiến độ trên trình duyệt.
- [x] Viết trang lobby gồm bàn poker/blackjack và đường dẫn học toán.
- [ ] Hoàn thiện globals.css, kiểm tra desktop/mobile và điều hướng.
- [ ] Typecheck/build phù hợp; lưu checkpoint commit.

**Điểm tiếp tục ngay:** app/layout.tsx đã import `./globals.css` nhưng file CSS CHƯA tồn tại. Các link /practice/poker, /practice/blackjack, /learn, /math CHƯA được triển khai. Cần tạo CSS và các trang đích có nội dung hữu ích trước khi bàn giao.

### 2. Bàn poker — CHƯA LÀM

- Bàn 6-max, vị trí, bài hero, board, pot, stack, hành động.
- Nhiều tình huống preflop/flop/turn/river, có chọn nhóm bài tập.
- Chọn hành động → feedback + lý do + giả định + bài tiếp theo/replay.
- Chỉ hiển thị EV khi có phép tính/giả định minh bạch; chart heuristics không gọi là GTO.
- Kiểm tra mọi tình huống, card uniqueness, số tiền và chấm điểm không lặp do double click.
- /demo tiếp tục hoạt động, có thể trở thành alias cho bàn poker mới.
- Lưu checkpoint commit và trạng thái vào tài liệu này.

### 3. Bàn blackjack — CHƯA LÀM

- Chơi trọn ván bằng practice chips: deal, hit, stand, double, split, surrender.
- Ruleset hiển thị và có tùy chỉnh S17/H17, DAS, surrender, payout.
- Dealer peek, natural blackjack, soft ace, split ace, payout, bust, push được xử lý nhất quán.
- Coach chấm theo basic strategy phù hợp ruleset; kiểm tra các tình huống biên.
- Có tests độc lập cho quy tắc và chip settlement; kiểm tra trình duyệt.
- Lưu checkpoint commit và trạng thái vào tài liệu này.

### 4. Thư viện kiến thức và Math Lab — CHƯA LÀM

- Poker: pot odds, equity/outs, EV, combo/range/blocker, bluff, variance/rake.
- Blackjack: hard/soft, basic strategy, EV, rule effects, payout, house edge/variance.
- Bài học có công thức, ví dụ, câu hỏi kiểm tra và link nguồn.
- Máy tính pot odds/call EV; equity heads-up kết nối engine; blackjack EV; expected loss với house edge nhập vào.
- Thông báo loading/error, validation đầu vào và ghi rõ approximation của engine.
- Nguồn đã xem: Wizard of Odds basic strategy calculator; MIT OCW 18.05 Probability and Statistics.
- Lưu checkpoint commit và trạng thái vào tài liệu này.

### 5. Tích hợp và bàn giao — CHƯA LÀM

- Test math engine và logic game; typecheck cả workspace; production build.
- Kiểm tra trực tiếp các luồng trên trình duyệt và responsive, không chỉ syntax.
- Lưu báo cáo kiểm tra và screenshot trong outputs.
- Tạo bản review/PR hoặc deploy preview theo quyền kết nối thực có; báo rõ nếu cần user action.
- Không tuyên bố production đã cập nhật khi chưa xác minh URL.

## Trạng thái môi trường

`pnpm install --no-frozen-lockfile` đã được khởi chạy trong checkout làm việc; cần kiểm tra kết quả session trước bước phụ thuộc. Nếu session không còn tồn tại, kiểm tra node_modules/lockfile rồi chạy lại khi cần.

Các file vừa tạo/sửa: apps/web/components/{app-shell,playing-card,progress}.tsx; apps/web/app/{layout,page}.tsx; apps/web/app/icon.svg.

## Cách tiếp tục ở chat mới

Đọc tài liệu này và `git status` trước. Đọc docs trong repo và mã liên quan đến chặng hiện tại. Không đọc lại toàn bộ lịch sử hay làm lại phần đã kiểm tra. Làm xong một chặng, chạy kiểm tra tương ứng, lưu checkpoint, rồi cập nhật mục trạng thái và bước tiếp theo. Nếu gần hết context/token, ưu tiên hoàn tất và ghi lại chặng hiện tại thay vì mở thêm tính năng.
