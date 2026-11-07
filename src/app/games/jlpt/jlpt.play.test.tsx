import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import StarScramblePlayPage from "./star-scramble/play/[sessionId]/page";
import PhoneticTrapPlayPage from "./phonetic-traps/play/[sessionId]/page";
import SynonymMatchPlayPage from "./synonym-match/play/[sessionId]/page";
import InstantReplyPlayPage from "./instant-reply/play/[sessionId]/page";
import {
  STAR_SCRAMBLE_ITEMS,
  createStarScrambleSession,
} from "@/engine/jlptStarScramble";
import {
  PHONETIC_TRAP_ITEMS,
  createPhoneticTrapSession,
} from "@/engine/jlptPhoneticTraps";
import {
  SYNONYM_MATCH_ITEMS,
  createSynonymMatchSession,
} from "@/engine/jlptSynonymMatch";
import {
  INSTANT_REPLY_ITEMS,
  createInstantReplySession,
} from "@/engine/jlptInstantReply";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "jlpt-test-session" }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

describe("JLPT Games Quit Warning Guard", () => {
  const sessionId = "jlpt-test-session";

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Star Sentence Scramble (/games/jlpt/star-scramble/play/[sessionId])", () => {
    beforeEach(() => {
      const session = createStarScrambleSession(
        STAR_SCRAMBLE_ITEMS,
        { levels: ["N5"], size: 10, showEnglishHint: true, showFurigana: false },
        () => 0.2,
        sessionId,
      );
      sessionStorage.setItem(`jlpt-star-session:${sessionId}`, JSON.stringify(session));
    });

    it("prompts quit dialog on browser back button, closes on Stay, and cleans up on Quit game", async () => {
      render(<StarScramblePlayPage />);

      // Trigger popstate (browser back)
      await waitFor(() => {
        act(() => window.dispatchEvent(new PopStateEvent("popstate")));
        expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
      });

      // Clicking "Stay" closes dialog
      fireEvent.click(screen.getByRole("button", { name: "Stay" }));
      expect(screen.queryByRole("dialog")).toBeNull();

      // Trigger back again and confirm quit
      await waitFor(() => {
        act(() => window.dispatchEvent(new PopStateEvent("popstate")));
        expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: "Quit game" }));
      expect(sessionStorage.getItem(`jlpt-star-session:${sessionId}`)).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith("/games/jlpt/star-scramble");
    });

    it("prompts quit dialog when clicking navbar brand home link", async () => {
      render(<StarScramblePlayPage />);

      const brandLink = screen.getByRole("link", { name: /star sentence scramble home/i });
      fireEvent.click(brandLink);

      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Quit game" }));

      expect(sessionStorage.getItem(`jlpt-star-session:${sessionId}`)).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith("/games/jlpt/star-scramble");
    });
  });

  describe("Phonetic Trap Sniper (/games/jlpt/phonetic-traps/play/[sessionId])", () => {
    beforeEach(() => {
      const session = createPhoneticTrapSession(
        PHONETIC_TRAP_ITEMS,
        { subMode: "reading", levels: ["N5"], size: 10, showEnglishHint: true, showFurigana: false },
        () => 0.2,
        sessionId,
      );
      sessionStorage.setItem(`jlpt-traps-session:${sessionId}`, JSON.stringify(session));
    });

    it("prompts quit dialog on browser back button, closes on Stay, and cleans up on Quit game", async () => {
      render(<PhoneticTrapPlayPage />);

      // Trigger popstate (browser back)
      await waitFor(() => {
        act(() => window.dispatchEvent(new PopStateEvent("popstate")));
        expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
      });

      // Clicking "Stay" closes dialog
      fireEvent.click(screen.getByRole("button", { name: "Stay" }));
      expect(screen.queryByRole("dialog")).toBeNull();

      // Trigger back again and confirm quit
      await waitFor(() => {
        act(() => window.dispatchEvent(new PopStateEvent("popstate")));
        expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: "Quit game" }));
      expect(sessionStorage.getItem(`jlpt-traps-session:${sessionId}`)).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith("/games/jlpt/phonetic-traps");
    });

    it("prompts quit dialog when clicking navbar brand home link", async () => {
      render(<PhoneticTrapPlayPage />);

      const brandLink = screen.getByRole("link", { name: /phonetic trap sniper home/i });
      fireEvent.click(brandLink);

      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Quit game" }));

      expect(sessionStorage.getItem(`jlpt-traps-session:${sessionId}`)).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith("/games/jlpt/phonetic-traps");
    });
  });

  describe("Synonym Paraphrase Match (/games/jlpt/synonym-match/play/[sessionId])", () => {
    beforeEach(() => {
      const session = createSynonymMatchSession(
        SYNONYM_MATCH_ITEMS,
        {
          levels: [5],
          size: 10,
          scriptMode: "exam-authentic",
          showSentenceTranslationHint: false,
        },
        () => 0.2,
        sessionId,
      );
      sessionStorage.setItem(`jlpt-synonym-session:${sessionId}`, JSON.stringify(session));
    });

    it("prompts quit dialog on browser back button, closes on Stay, and cleans up on Quit game", async () => {
      render(<SynonymMatchPlayPage />);

      await waitFor(() => {
        act(() => window.dispatchEvent(new PopStateEvent("popstate")));
        expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: "Stay" }));
      expect(screen.queryByRole("dialog")).toBeNull();

      await waitFor(() => {
        act(() => window.dispatchEvent(new PopStateEvent("popstate")));
        expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: "Quit game" }));
      expect(sessionStorage.getItem(`jlpt-synonym-session:${sessionId}`)).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith("/games/jlpt/synonym-match");
    });
  });

  describe("Instant Reply Blitz (/games/jlpt/instant-reply/play/[sessionId])", () => {
    beforeEach(() => {
      const session = createInstantReplySession(
        INSTANT_REPLY_ITEMS,
        {
          levels: [5],
          size: 10,
          timerSeconds: 8,
          autoSequenceAudio: false,
          showSituationHint: true,
        },
        () => 0.2,
        sessionId,
      );
      sessionStorage.setItem(`jlpt-reply-session:${sessionId}`, JSON.stringify(session));
    });

    it("prompts quit dialog on browser back button, closes on Stay, and cleans up on Quit game", async () => {
      render(<InstantReplyPlayPage />);

      await waitFor(() => {
        act(() => window.dispatchEvent(new PopStateEvent("popstate")));
        expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: "Stay" }));
      expect(screen.queryByRole("dialog")).toBeNull();

      await waitFor(() => {
        act(() => window.dispatchEvent(new PopStateEvent("popstate")));
        expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: "Quit game" }));
      expect(sessionStorage.getItem(`jlpt-reply-session:${sessionId}`)).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith("/games/jlpt/instant-reply");
    });
  });
});
