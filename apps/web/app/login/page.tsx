import { signIn } from "@/auth";
const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID);
const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID);
const emailEnabled = Boolean(process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM);

export default function LoginPage() {
  return <main style={{ maxWidth: 560, margin: "4rem auto", fontFamily: "system-ui", padding: "0 1rem" }}>
    <h1>Sign in to Pokerlingo</h1>
    <p>Use a configured account to save your learning progress.</p>
    {githubEnabled && <form action={async () => { "use server"; await signIn("github", { redirectTo: "/" }); }}><button type="submit">Continue with GitHub</button></form>}
    {googleEnabled && <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}><button type="submit">Continue with Google</button></form>}
    {emailEnabled && <form action={async (formData: FormData) => { "use server"; await signIn("resend", { email: String(formData.get("email") ?? ""), redirectTo: "/" }); }}>
      <label>Email <input type="email" name="email" required /></label><button type="submit">Send magic link</button>
    </form>}
    {!githubEnabled && !googleEnabled && !emailEnabled && <p>An administrator must configure an OAuth or email provider.</p>}
  </main>;
}