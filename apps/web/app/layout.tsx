import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pokerlingo",
  description: "Học poker, blackjack và xác suất qua các bài giải thích EV rõ ràng."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
