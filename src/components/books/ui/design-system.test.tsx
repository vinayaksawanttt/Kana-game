import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BookOpen, Sparkles } from "lucide-react";
import {
  Breadcrumbs,
  CircularProgress,
  ContentCard,
  ContentContainer,
  ContextMenu,
  EmptyState,
  FilterDropdown,
  LessonNavigation,
  LevelBadge,
  LoadingSkeleton,
  PageHeader,
  ProgressBar,
  ResponsiveGrid,
  SearchInput,
  SectionHeader,
  StatusBadge,
  TabNavigation,
  TextbookButton,
  Tooltip,
  parseGrammarPattern,
} from "./index";

describe("Textbook Companion Design System (UI Foundation)", () => {
  afterEach(() => {
    cleanup();
  });

  describe("Layout Components", () => {
    it("renders PageHeader with badge, Japanese subtitle, title, description, and rightSlot", () => {
      render(
        <PageHeader
          badge={<StatusBadge variant="in-progress">Genki I</StatusBadge>}
          japaneseTitle="第3課 デートの約束"
          title="Daily Life & Making a Date"
          description="Learn polite invitations and time expressions."
          rightSlot={<TextbookButton>Enqueue All</TextbookButton>}
        />
      );

      expect(screen.getByText("Genki I")).toBeTruthy();
      expect(screen.getByText("第3課 デートの約束")).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Daily Life & Making a Date" })).toBeTruthy();
      expect(screen.getByText("Learn polite invitations and time expressions.")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Enqueue All" })).toBeTruthy();
    });

    it("renders SectionHeader with icon, count badge, subtitle, and actions", () => {
      render(
        <SectionHeader
          title="Vocabulary"
          subtitle="Core lesson words"
          count={42}
          icon={<BookOpen data-testid="section-icon" />}
          actions={<button type="button">Filter</button>}
        />
      );

      expect(screen.getByTestId("section-icon")).toBeTruthy();
      expect(screen.getByText("Vocabulary")).toBeTruthy();
      expect(screen.getByText("42")).toBeTruthy();
      expect(screen.getByText("Core lesson words")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
    });

    it("renders ContentContainer and ResponsiveGrid cleanly", () => {
      render(
        <ContentContainer variant="subtle" aria-label="Grid container">
          <ResponsiveGrid columns={3} gap="md">
            <ContentCard interactive>Item 1</ContentCard>
            <ContentCard selected>Item 2</ContentCard>
          </ResponsiveGrid>
        </ContentContainer>
      );

      expect(screen.getByLabelText("Grid container")).toBeTruthy();
      expect(screen.getByText("Item 1")).toBeTruthy();
      expect(screen.getByText("Item 2")).toBeTruthy();
    });
  });

  describe("Navigation Components", () => {
    it("renders Breadcrumbs and LessonNavigation with prev/next controls", () => {
      render(
        <LessonNavigation
          bookId="genki-1"
          bookTitle="Genki I"
          lessonNumber={3}
          prevLessonNumber={2}
          nextLessonNumber={4}
        />
      );

      expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
      expect(screen.getByRole("link", { name: /All Books/i }).getAttribute("href")).toBe("/books");
      expect(screen.getByText("Genki I")).toBeTruthy();
      expect(screen.getByText("Lesson 3")).toBeTruthy();
      expect(screen.getByRole("link", { name: /Lesson 2/i }).getAttribute("href")).toBe("/books/genki-1/2");
      expect(screen.getByRole("link", { name: /Lesson 4/i }).getAttribute("href")).toBe("/books/genki-1/4");
    });

    it("renders standalone Breadcrumbs without backHref", () => {
      render(
        <Breadcrumbs
          items={[
            { label: "Library", href: "/books" },
            { label: "Unit 5", isCurrent: true },
          ]}
        />
      );

      expect(screen.getByRole("link", { name: "Library" })).toBeTruthy();
      expect(screen.getByText("Unit 5").getAttribute("aria-current")).toBe("page");
    });

    it("renders TabNavigation with counts and handles selection", () => {
      const onSelect = vi.fn();
      render(
        <TabNavigation
          tabs={[
            { id: "vocab", label: "単語 Vocabulary", count: 30 },
            { id: "grammar", label: "文法 Grammar", count: 8 },
          ]}
          activeTab="vocab"
          onSelect={onSelect}
        />
      );

      const vocabBtn = screen.getByRole("button", { name: "単語 Vocabulary" });
      const grammarBtn = screen.getByRole("button", { name: "文法 Grammar" });

      expect(vocabBtn.getAttribute("aria-pressed")).toBe("true");
      expect(grammarBtn.getAttribute("aria-pressed")).toBe("false");
      expect(screen.getByText("30")).toBeTruthy();
      expect(screen.getByText("8")).toBeTruthy();

      fireEvent.click(grammarBtn);
      expect(onSelect).toHaveBeenCalledWith("grammar");
    });
  });

  describe("UI Element Primitives", () => {
    it("supports TextbookButton variants, loading state, and disabled state", () => {
      const onClick = vi.fn();
      render(
        <div>
          <TextbookButton variant="primary" onClick={onClick} leftIcon={<Sparkles size={12} />}>
            Primary Action
          </TextbookButton>
          <TextbookButton variant="secondary" loading>
            Saving
          </TextbookButton>
          <TextbookButton variant="destructive" disabled>
            Delete
          </TextbookButton>
        </div>
      );

      fireEvent.click(screen.getByRole("button", { name: "Primary Action" }));
      expect(onClick).toHaveBeenCalledTimes(1);

      const savingBtn = screen.getByRole("button", { name: "Saving" }) as HTMLButtonElement;
      expect(savingBtn.disabled).toBe(true);
      expect(savingBtn.getAttribute("aria-busy")).toBe("true");

      const deleteBtn = screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement;
      expect(deleteBtn.disabled).toBe(true);
    });

    it("renders StatusBadge and LevelBadge variants", () => {
      render(
        <div>
          <StatusBadge variant="mastered">Mastered</StatusBadge>
          <StatusBadge variant="due">Due Soon</StatusBadge>
          <LevelBadge level="N5" />
          <LevelBadge level="4" prefix="JLPT N" />
        </div>
      );

      expect(screen.getByText("Mastered")).toBeTruthy();
      expect(screen.getByText("Due Soon")).toBeTruthy();
      expect(screen.getByText("N5")).toBeTruthy();
      expect(screen.getByText("JLPT N4")).toBeTruthy();
    });

    it("renders ProgressBar and CircularProgress with accurate aria attributes", () => {
      render(
        <div>
          <ProgressBar value={65} masteryValue={30} label="SRS Progress" showPercentage />
          <CircularProgress value={80} label="Course Progress" sublabel="40 / 50 units" />
        </div>
      );

      const bars = screen.getAllByRole("progressbar");
      expect(bars[0].getAttribute("aria-valuenow")).toBe("65");
      expect(screen.getByText("65%")).toBeTruthy();
      expect(bars[1].getAttribute("aria-valuenow")).toBe("80");
      expect(screen.getByText("80%")).toBeTruthy();
      expect(screen.getByText("Course Progress")).toBeTruthy();
    });

    it("renders SearchInput with label, helper/error states, and clear trigger", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <SearchInput
          label="Find Lesson"
          value="okina"
          onChange={onChange}
          helperText="Search across titles or grammar"
        />
      );

      expect(screen.getByLabelText("Find Lesson")).toBeTruthy();
      expect(screen.getByText("Search across titles or grammar")).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
      expect(onChange).toHaveBeenCalledWith("");

      rerender(
        <SearchInput
          label="Find Lesson"
          value=""
          onChange={onChange}
          errorText="Please enter at least 2 characters"
        />
      );
      expect(screen.getByRole("alert").textContent).toBe("Please enter at least 2 characters");
    });

    it("renders FilterDropdown in both pills and select modes", () => {
      const onChange = vi.fn();
      const options = [
        { key: "all", label: "All", count: 10 },
        { key: "verb", label: "Verbs", count: 4 },
      ];

      const { rerender } = render(
        <FilterDropdown options={options} value="all" onChange={onChange} mode="pills" />
      );

      fireEvent.click(screen.getByRole("button", { name: "Verbs (4)" }));
      expect(onChange).toHaveBeenCalledWith("verb");

      rerender(
        <FilterDropdown
          options={options}
          value="all"
          onChange={onChange}
          mode="select"
          label="Part of Speech"
        />
      );

      const select = screen.getByLabelText("Part of Speech") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "verb" } });
      expect(onChange).toHaveBeenCalledWith("verb");
    });

    it("renders EmptyState, LoadingSkeleton, Tooltip, and ContextMenu", () => {
      const onExport = vi.fn();
      render(
        <div>
          <EmptyState
            title="Nothing Found"
            description="Adjust filters to continue."
            action={<button type="button">Reset</button>}
          />
          <LoadingSkeleton variant="card" count={2} />
          <Tooltip content="Keyboard shortcut hint">
            <span>Info</span>
          </Tooltip>
          <ContextMenu
            triggerLabel="Lesson options"
            items={[
              { id: "export", label: "Export CSV", onSelect: onExport },
              { id: "reset", label: "Clear Progress", onSelect: vi.fn(), destructive: true },
            ]}
          />
        </div>
      );

      expect(screen.getByText("Nothing Found")).toBeTruthy();
      expect(screen.getByLabelText("Loading content")).toBeTruthy();

      fireEvent.mouseEnter(screen.getByText("Info"));
      expect(screen.getByRole("tooltip").textContent).toBe("Keyboard shortcut hint");

      fireEvent.click(screen.getByRole("button", { name: "Lesson options" }));
      const exportItem = screen.getByRole("menuitem", { name: "Export CSV" });
      fireEvent.click(exportItem);
      expect(onExport).toHaveBeenCalledTimes(1);
    });

    it("parses grammar patterns into categorized PatternChips", () => {
      const chips = parseGrammarPattern("Noun1 は Noun2 です");
      expect(chips.map((c) => c.category)).toEqual(["topic", "particle", "topic", "auxiliary"]);
    });
  });
});
