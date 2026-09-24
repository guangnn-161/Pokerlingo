import Link from "next/link";
import { auth } from "@/auth";

const cardStyle = {
  border: "1px solid #d7d7d7",
  borderRadius: 12,
  padding: "1.25rem",
  background: "#fff"
};

export default async function Home() {
  const session = await auth();
  const learner = session?.user;

  return <main style={{ maxWidth: 920, margin: "4rem auto", fontFamily: "system-ui", padding: "0 1rem", color: "#171717" }}>
    <section style={{ marginBottom: "2.5rem" }}>
      <p style={{ color: "#a16207", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", margin: 0 }}>Poker · Blackjack · Xác suất</p>
      <h1 style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", margin: ".35rem 0 .75rem" }}>Pokerlingo</h1>
      <p style={{ fontSize: "1.15rem", maxWidth: 660, lineHeight: 1.6 }}>
        Luyện ra quyết định, hiểu EV và xây dựng trực giác toán học vững vàng hơn cho các trò chơi có yếu tố may rủi.
      </p>
      <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/demo" style={{ display: "inline-block", padding: ".7rem 1rem", background: "#a16207", color: "white", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>Mở demo học tập</Link>
        {learner ? <>
          <span>Đã đăng nhập với <strong>{learner.name ?? learner.email ?? "người học"}</strong>.</span>
          <Link href="/profile">Mở hồ sơ</Link>
          <Link href="/api/me">Thông tin phiên đăng nhập</Link>
        </> : <Link href="/login" style={{ color: "#171717" }}>Đăng nhập để lưu tiến độ</Link>}
      </div>
    </section>

    <section aria-label="Khu vực học" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
      <article style={cardStyle}><h2>Luyện quyết định</h2><p>Demo đã có một poker spot: chọn action, nhận EV loss và lời giải thích. Các scenario thật sẽ được đội C đưa vào sau.</p></article>
      <article style={cardStyle}><h2>Phòng thí nghiệm toán</h2><p>Package toán demo tách riêng khỏi UI: pot odds/EV poker, blackjack cơ bản, house edge roulette và overround.</p></article>
      <article style={cardStyle}><h2>Tiến độ hằng ngày</h2><p>Demo hiển thị XP, quest, leaderboard và friends bằng mock có contract rõ ràng để đội D hoàn thiện giao diện.</p></article>
    </section>
  </main>;
}
