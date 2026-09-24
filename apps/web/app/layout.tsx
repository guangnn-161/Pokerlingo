import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pokerlingo",
  description: "Learn poker, blackjack and probability through clear EV explanations and interactive drills."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
