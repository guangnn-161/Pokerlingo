import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export default async function TrainingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return children;
}
