import type { Metadata } from "next";
import { PersonalSheetClient } from "@/features/learn/components/PersonalSheetClient";

export const metadata: Metadata = {
  title: "Mistake Bank | Learning Hub",
  description: "Review recurring mistakes from recent Japanese practice sessions and FSRS cards.",
};

export default function MistakeBankPage() {
  return <PersonalSheetClient kind="mistake-bank" />;
}
