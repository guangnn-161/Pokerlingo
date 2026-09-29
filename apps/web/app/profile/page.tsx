import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "4rem auto",
        fontFamily: "system-ui",
        padding: "0 1rem",
        color: "var(--ink)",
      }}
    >
      <p
        style={{
          color: "var(--lime)",
          fontWeight: 700,
          letterSpacing: ".06em",
          textTransform: "uppercase",
        }}
      >
        Account
      </p>
      <h1>Learner profile</h1>
      <p>
        Manage your display name and privacy preferences. Training progress
        currently stays in this browser.
      </p>
      <ProfileForm
        initialDisplayName={user.profile?.displayName ?? user.name ?? ""}
        initialHandle={user.profile?.handle ?? ""}
        initialVisibility={user.profile?.visibility ?? "private"}
      />
    </main>
  );
}
