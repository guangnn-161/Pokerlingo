import { signIn } from "@/auth";

const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID);
const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID);
const emailEnabled = Boolean(process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM);

export default function LoginPage() {
  return <main style={{ maxWidth: 560, margin: "4rem auto", fontFamily: "system-ui", padding: "0 1rem" }}>
    <h1>Đăng nhập Pokerlingo</h1>
    <p>Đăng nhập để lưu tiến độ học của bạn.</p>
    {githubEnabled && <form action={async () => { "use server"; await signIn("github", { redirectTo: "/" }); }}><button type="submit">Tiếp tục với GitHub</button></form>}
    {googleEnabled && <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}><button type="submit">Tiếp tục với Google</button></form>}
    {emailEnabled && <form action={async (formData: FormData) => { "use server"; await signIn("resend", { email: String(formData.get("email") ?? ""), redirectTo: "/" }); }}>
      <label>Email <input type="email" name="email" required /></label><button type="submit">Gửi liên kết đăng nhập</button>
    </form>}
    {!githubEnabled && !googleEnabled && !emailEnabled && <p>Quản trị viên cần cấu hình phương thức đăng nhập OAuth hoặc email.</p>}
  </main>;
}
