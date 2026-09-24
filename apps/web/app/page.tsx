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
      {learner ? <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
        <span>Đã đăng nhập với <strong>{learner.name ?? learner.email ?? "người học"}</strong>.</span>
        <Link href="/profile">Mở hồ sơ</Link>
        <Link href="/api/me">Thông tin phiên đăng nhập</Link>
      </div> : <Link href="/login" style={{ display: "inline-block", marginTop: ".5rem", padding: ".7rem 1rem", background: "#171717", color: "white", borderRadius: 8, textDecoration: "none" }}>Đăng nhập để lưu tiến độ</Link>}
    </section>

    <section aria-label="Khu vực học" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
      <article style={cardStyle}><h2>Luyện quyết định</h2><p>Các tình huống poker và blackjack sẽ được xây dựng tại đây. Mỗi đáp án ghi rõ giả định và giải thích EV.</p></article>
      <article style={cardStyle}><h2>Phòng thí nghiệm toán</h2><p>Khám phá xác suất, tỷ lệ cược, phương sai và giá trị kỳ vọng trước khi áp dụng vào bàn chơi.</p></article>
      <article style={cardStyle}><h2>Tiến độ hằng ngày</h2><p>Câu đố mỗi ngày, nhiệm vụ, cấp bậc và bạn bè sẽ gắn với hồ sơ tài khoản của bạn.</p></article>
    </section>
  </main>;
}
