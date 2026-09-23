import type { Metadata } from "next";
export const metadata: Metadata = { title: "Pokerlingo", description: "Learn poker, blackjack and probability with explainable EV." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}