import { BlackjackTrainer } from "./blackjack-trainer";
export const metadata = { title: "Blackjack table · Pokerlingo" };
export default async function BlackjackPage({
  searchParams,
}: {
  searchParams: Promise<{ counting?: string }>;
}) {
  const counting = (await searchParams).counting === "1";
  return <BlackjackTrainer key={String(counting)} counting={counting} />;
}
