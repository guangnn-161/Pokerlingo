import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <main style={{ maxWidth: 640, margin: "4rem auto", fontFamily: "system-ui", padding: "0 1rem", color: "#171717" }}>
    <p style={{ color: "#a16207", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>Tài khoản</p>
    <h1>Hồ sơ người học</h1>
    <p>Đặt tên hiển thị và mức riêng tư dùng cho bảng xếp hạng, bạn bè và các tính năng theo dõi tiến độ sau này.</p>
    <ProfileForm
      initialDisplayName={user.profile?.displayName ?? user.name ?? ""}
      initialHandle={user.profile?.handle ?? ""}
      initialVisibility={user.profile?.visibility ?? "private"}
    />
  </main>;
}
