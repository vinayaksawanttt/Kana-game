import type { Metadata } from "next";
import { PersonalSheetClient } from "@/components/learn/PersonalSheetClient";

export const metadata: Metadata = {
  title: "Kanji You Keep Missing | Learning Hub",
  description: "Review kanji cards with FSRS lapses or high difficulty.",
};

export default function MissedKanjiPage() {
  return <PersonalSheetClient kind="missed-kanji" />;
}
