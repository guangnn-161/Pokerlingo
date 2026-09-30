import type { Metadata } from "next";
import { CountingTrainer } from "./counting-trainer";
export const metadata: Metadata = {
  title: "Card counting practice · Pokerlingo",
};
export default function Page() {
  return <CountingTrainer />;
}
