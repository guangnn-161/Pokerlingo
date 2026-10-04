import Link from "next/link";
import { signIn } from "@/auth";
const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID),
  googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID),
  emailEnabled = Boolean(process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM);
export default function LoginPage() {
  return (
    <section
      className="content-panel"
      style={{ maxWidth: 560, margin: "35px auto" }}
    >
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h1>Welcome back.</h1>
      <p>
        Sign in to manage your learner profile. Table practice and lesson
        progress are currently saved in this browser.
      </p>
      <div style={{ display: "grid", gap: 16, margin: "24px 0" }}>
        {githubEnabled && (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/" });
            }}
          >
            <button className="button primary" type="submit">
              Continue with GitHub
            </button>
          </form>
        )}
        {googleEnabled && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button className="button primary" type="submit">
              Continue with Google
            </button>
          </form>
        )}
        {emailEnabled && (
          <form
            action={async (formData: FormData) => {
              "use server";
              await signIn("resend", {
                email: String(formData.get("email") ?? ""),
                redirectTo: "/",
              });
            }}
          >
            <label className="field">
              Email
              <input type="email" name="email" required />
            </label>
            <button
              className="button primary"
              style={{ marginTop: 16 }}
              type="submit"
            >
              Send sign-in link
            </button>
          </form>
        )}
        {!githubEnabled && !googleEnabled && !emailEnabled && (
          <p>
            Account sign-in is not configured in this environment. You can still
            use both training tables and the library.
          </p>
        )}
      </div>
      <Link className="text-link" href="/">
        Continue practicing without an account →
      </Link>
    </section>
  );
}
