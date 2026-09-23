import { signIn } from "@/auth";
export default function LoginPage() {
  return <main style={{ maxWidth: 560, margin: "4rem auto", fontFamily: "system-ui", padding: "0 1rem" }}>
    <h1>Sign in to Pokerlingo</h1>
    <p>Choose a configured provider. Magic link appears when Resend is configured.</p>
    <form action={async () => { "use server"; await signIn("github", { redirectTo: "/" }); }}>
      <button type="submit">Continue with GitHub</button>
    </form>
    <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
      <button type="submit">Continue with Google</button>
    </form>
  </main>;
}