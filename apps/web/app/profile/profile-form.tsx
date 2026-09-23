"use client";

import { useState, type FormEvent } from "react";

type Visibility = "private" | "friends" | "public";

export function ProfileForm({
  initialHandle,
  initialDisplayName,
  initialVisibility
}: {
  initialHandle: string;
  initialDisplayName: string;
  initialVisibility: Visibility;
}) {
  const [handle, setHandle] = useState(initialHandle);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        handle: handle || undefined,
        displayName: displayName || undefined,
        visibility
      })
    });

    const result = await response.json().catch(() => null);
    setSaving(false);
    setMessage(response.ok ? "Profile saved." : result?.message ?? "Could not save profile.");
  }

  return <form onSubmit={saveProfile} style={{ display: "grid", gap: "1rem", marginTop: "2rem" }}>
    <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} style={{ display: "block", width: "100%", marginTop: ".35rem", padding: ".65rem" }} /></label>
    <label>Handle<input value={handle} onChange={(event) => setHandle(event.target.value.toLowerCase())} pattern="[a-z0-9_]{3,24}" placeholder="poker_learner" style={{ display: "block", width: "100%", marginTop: ".35rem", padding: ".65rem" }} /></label>
    <label>Visibility<select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)} style={{ display: "block", width: "100%", marginTop: ".35rem", padding: ".65rem" }}><option value="private">Private</option><option value="friends">Friends</option><option value="public">Public</option></select></label>
    <button disabled={saving} type="submit" style={{ width: "fit-content", padding: ".7rem 1rem" }}>{saving ? "Saving…" : "Save profile"}</button>
    <p aria-live="polite" style={{ margin: 0 }}>{message}</p>
  </form>;
}
