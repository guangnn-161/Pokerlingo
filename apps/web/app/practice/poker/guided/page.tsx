import Link from "next/link";
import { PokerTrainer } from "../poker-trainer";
export default function Page() {
  return (
    <>
      <Link className="text-link" href="/practice/poker">
        ← Random practice in four variants
      </Link>
      <PokerTrainer />
    </>
  );
}
