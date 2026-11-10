import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import StarScramblePlayPage from "./star-scramble/play/[sessionId]/page";
import PhoneticTrapPlayPage from "./phonetic-traps/play/[sessionId]/page";
import SynonymMatchPlayPage from "./synonym-match/play/[sessionId]/page";
import InstantReplyPlayPage from "./instant-reply/play/[sessionId]/page";
import ParagraphClozePlayPage from "./paragraph-cloze/play/[sessionId]/page";
import InfoScannerPlayPage from "./info-scanner/play/[sessionId]/page";
import ListeningScenesPlayPage from "./listening-scenes/play/[sessionId]/page";
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
import {
  PARAGRAPH_CLOZE_PASSAGES,
  createParagraphClozeSession,
} from "@/engine/jlptParagraphCloze";
import {
  INFO_SCANNER_DOCUMENTS,
  createInfoScannerSession,
} from "@/engine/jlptInfoScanner";
import {
  createListeningSceneSession,
} from "@/engine/jlptListeningScene";
import {
  ALL_LISTENING_SCENES,
} from "@/data/jlpt/listeningScenesData";

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

  describe("Paragraph Flow Cloze (/games/jlpt/paragraph-cloze/play/[sessionId])", () => {
    beforeEach(() => {
      const session = createParagraphClozeSession(
        PARAGRAPH_CLOZE_PASSAGES,
        {
          levels: [5],
          sourceFilter: "all",
          passageCount: 2,
          showEnglishSentenceHints: false,
        },
        () => 0.2
      );
      session.sessionId = sessionId;
      sessionStorage.setItem(`jlpt-cloze-session:${sessionId}`, JSON.stringify(session));
    });

    it("prompts quit dialog on clicking home link, closes on Stay, and cleans up on Quit game", async () => {
      render(<ParagraphClozePlayPage />);

      const homeLink = screen.getByRole("link", { name: /paragraph flow cloze · 文章の文法 home/i });
      fireEvent.click(homeLink);

      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Stay" }));
      expect(screen.queryByRole("dialog")).toBeNull();

      fireEvent.click(homeLink);
      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Quit game" }));
      expect(sessionStorage.getItem(`jlpt-cloze-session:${sessionId}`)).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith("/games/jlpt/paragraph-cloze");
    });
  });

  describe("Real-World Info Scanner (/games/jlpt/info-scanner/play/[sessionId])", () => {
    beforeEach(() => {
      const session = createInfoScannerSession(
        INFO_SCANNER_DOCUMENTS,
        {
          levels: ["N5"],
          categoryFilter: "all",
          documentCount: 3,
          showScenarioEnglish: true,
        },
        () => 0.2
      );
      session.sessionId = sessionId;
      sessionStorage.setItem(`jlpt-scanner-session:${sessionId}`, JSON.stringify(session));
    });

    it("prompts quit dialog on clicking home link, closes on Stay, and cleans up on Quit game", async () => {
      render(<InfoScannerPlayPage />);

      const homeLink = screen.getByRole("link", { name: /real-world info scanner home/i });
      fireEvent.click(homeLink);

      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Stay" }));
      expect(screen.queryByRole("dialog")).toBeNull();

      fireEvent.click(homeLink);
      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Quit game" }));
      expect(sessionStorage.getItem(`jlpt-scanner-session:${sessionId}`)).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith("/games/jlpt/info-scanner");
    });
  });

  describe("Real-World Listening Scene (/games/jlpt/listening-scenes/play/[sessionId])", () => {
    beforeEach(() => {
      const session = createListeningSceneSession(
        ALL_LISTENING_SCENES,
        {
          levels: ["N5"],
          sceneCount: 3,
          mode: "exam",
        },
        () => 0.2
      );
      session.sessionId = sessionId;
      sessionStorage.setItem(`jlpt-scene-session:${sessionId}`, JSON.stringify(session));
    });

    it("prompts quit dialog on clicking home link, closes on Stay, and cleans up on Quit game", async () => {
      render(<ListeningScenesPlayPage />);

      const homeLink = screen.getByRole("link", { name: /audio listening scene · もんだい 1・2 home/i });
      fireEvent.click(homeLink);

      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Stay" }));
      expect(screen.queryByRole("dialog")).toBeNull();

      fireEvent.click(homeLink);
      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Quit game" }));
      expect(sessionStorage.getItem(`jlpt-scene-session:${sessionId}`)).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith("/games/jlpt/listening-scenes");
    });
  });
});
