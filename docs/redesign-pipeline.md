# Pokerlingo — pipeline tiếp tục

Cập nhật: 2026-09-29. Tài liệu này là trạng thái hiện tại; thay thế các ghi chú checkpoint cũ.

## Mục tiêu và quyết định

Thiết kế lại Pokerlingo thành nơi học poker và blackjack bằng bàn ảo, phản hồi quyết định và kiến thức toán học. Giao diện tiếng Anh theo chat trước; trao đổi và bàn giao bằng tiếng Việt. Tham khảo https://app.pokertrainer.se/lobby và https://blackjack-trainer.net/ về cách luyện tập, không sao chép giao diện/nội dung.

Đã đọc chat `Xây dựng platform` (6ab400bc-17fc-83ec-85b8-2831a0bdf49f) và `Quy trình xây dựng web poker` (6ab3d046-79a0-83ec-935b-276b22781e98). Bản cũ có demo một tình huống và math API. Giữ kiến trúc Next.js/Vercel cùng auth/profile/API hiện hữu. Roadmap XP, friends, leaderboard, multiplayer không nằm trong phạm vi đợt redesign này.

## Nơi làm việc

- Repo: https://github.com/guangnn-161/Pokerlingo
- Branch: `codex/pokerlingo-trainers`, base `8181ed4`.
- Checkout: `C:\Users\Guang\Documents\Codex\2026-09-29\https-github-com-worldflowai-everything-claude\work\pokerlingo`.
- Checkout gốc `D:\Pokerlingo` có thay đổi riêng của người dùng: không reset/clean/ghi đè.
- Dùng Git worktree thủ công sau khi công cụ managed worktree báo chat projectless không có repo.
- Stack: pnpm 9.15.4, Next.js 15, React 19; packages/contracts, db, math.
- Skills đã áp dụng: frontend-patterns, verification-loop, Vercel React/Next.js guidance. Bộ 11 skills ECC đã được cài ở chặng trước; không cài Claude hooks vào Codex.

## Các chặng có điểm dừng độc lập

| Chặng | Trạng thái | Sản phẩm và điều kiện hoàn thành |
| --- | --- | --- |
| 1. Sảnh và khung | Xong | Sidebar, lobby, navigation, bộ thẻ bài/chips, tiến độ browser-local, desktop/mobile CSS |
| 2. Poker | Xong | 9 tình huống Preflop/Pot odds/River, bàn 6-max, chọn đáp án, giải thích, next/replay; /demo mở trainer mới |
| 3. Blackjack | Xong | Deal/hit/stand/double/split/surrender; 6 decks, S17/H17, DAS, LS, 3:2/6:5, kết toán chips và coach |
| 4. Kiến thức/toán | Xong | 8 bài học, quiz, ghi nhận học xong; pot odds, outs, bluff, equity API, blackjack EV API, expected loss |
| 5. Kiểm tra và bàn giao | Đang chốt | Typecheck/tests/build; browser desktop/mobile; lưu ảnh; push branch, PR và xác minh preview |

Checkpoint Git đầu tiên: `a870e94` — sảnh và hai bàn thực hành. Checkpoint tiếp theo chứa thư viện, Math Lab và kết quả QA; xem `git log -5 --oneline` để lấy mã mới nhất.

## Giới hạn sản phẩm phải giữ rõ

- Poker là bộ tình huống biên soạn, chưa phải engine chơi trọn hand với bot/GTO solver. Preflop có teaching policy; EV chỉ xuất hiện khi có giả định tính được.
- Blackjack chơi trọn round, shoe 6 bộ được xáo lại mỗi round; một lần split thành 2 hand, split ace nhận 1 lá; dealer peek. Coach là chart multi-deck total-dependent, không phải solver composition/count; không tuyên bố mọi rule variant/giới hạn split đều tối ưu chính xác.
- Math Lab blackjack là mô hình infinite-deck trước dealer peek, khác trạng thái bàn chơi sau peek; UI phải giữ nhãn này. Xác suất và EV không đảm bảo kết quả một ván.
- Tiến độ bài học/quyết định lưu trong localStorage theo browser. Chưa đồng bộ tài khoản. Chips không có giá trị tiền thật.
- Auth và DB thật chưa được kiểm tra end-to-end; không nói đã xác minh chỉ vì build thành công. Không sao chép/in secrets từ checkout gốc.

## Bản đồ mã

- `apps/web/app/globals.css`: hệ màu, responsive, tables, cards, library/math.
- `apps/web/components/app-shell.tsx`, `playing-card.tsx`, `progress.tsx`: shell, đồ họa và local progress.
- `apps/web/app/practice/{poker,blackjack}`: giao diện hai bàn.
- `apps/web/lib/poker-drills.ts`: câu hỏi poker, giả định và EV.
- `apps/web/lib/blackjack-game.ts`: luật/chip settlement/chart, độc lập React.
- `apps/web/lib/blackjack-game.test.ts`: 24 tests engine/chart/curriculum.
- `apps/web/lib/lessons.ts`, `app/learn`, `components/lesson-quiz.tsx`: 8 bài gốc, ví dụ, quiz, nguồn.
- `apps/web/app/math/math-lab.tsx`: máy tính và request đến API hiện hữu.
- `packages/math/src/index.test.ts`: 15 tests math engine có sẵn.

## Kiểm tra đã xác minh

- `pnpm typecheck`: PASS trên toàn workspace.
- `pnpm test`: PASS 39 tests (15 math + 24 game/curriculum). DB/contracts chưa có tests. Chưa đo coverage.
- Production build cuối: PASS 27 trang. Diff whitespace check PASS; không có lỗi console trong các luồng đã kiểm tra.
- Browser: poker Raise đúng, chuyển nhóm pot odds; blackjack Deal → Hit → Stand → dealer bust → +10 chips và score; rule controls khóa trong ván.
- Math API qua UI: equity mặc định 45.3% với 3,000 mẫu seeded; blackjack có bảng EV và surrender; direct request từ chối duplicate poker cards với 422.
- Bài học: đáp án sai có giải thích, đổi đáp án đúng, đánh dấu hoàn thành, reload vẫn giữ trạng thái.
- QA mobile 390 × 844: poker và blackjack không tràn ngang; đã kiểm tra đổi H17 và khóa rules khi deal. Replay/next poker hoạt động. UI Math Lab hiển thị Duplicate card As cho dữ liệu sai. Ảnh bàn poker, lobby và mobile lưu tại outputs của chat. Còn xác minh preview trên Vercel.

## Quy trình chạy lại

Trong checkout làm việc: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
Build cục bộ cần biến DATABASE_URL vì module DB import lúc build; dùng database thử nghiệm. Build không chứng minh kết nối DB hoạt động. Không ghi thông tin đăng nhập vào tài liệu.
Chạy preview: `pnpm --filter @pokerlingo/web start --hostname 127.0.0.1 --port 3100` sau build. Không chạy dev/build đồng thời trên cùng thư mục `.next`.

## Cách nối tiếp mà không mất công

1. Đọc tài liệu này, `git status`, `git log -5 --oneline`; bảo toàn mọi thay đổi chưa commit.
2. Ưu tiên hoàn thành chặng 5 trước khi thêm tính năng. Chỉ đánh dấu xong khi có kết quả kiểm tra cụ thể.
3. Mỗi phần mới nên vừa một checkpoint: engine → UI → kiểm tra → commit → cập nhật pipeline.
4. Trước khi dừng, ghi rõ file đang sửa, lệnh đang chạy, lỗi còn lại và bước kế tiếp. Không để ghi chú cũ mâu thuẫn với trạng thái mới.
5. Nếu mở rộng: ưu tiên poker full-hand engine, thêm drill packs và progress sync theo từng chặng riêng; không gộp multiplayer/leaderboard vào cùng một lần sửa.

