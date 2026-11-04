import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { getAllLearnDocs, getLearnDocBySlug } from "./learn";

describe("learn content parser", () => {
  it("loads the reference library and normalizes JLPT ranges", () => {
    const docs = getAllLearnDocs();
    const verbs = docs.find((doc) => doc.slug === "japanese-verb-forms-table");

    expect(docs.length).toBeGreaterThan(0);
    expect(new Set(docs.map((doc) => doc.category)).size).toBe(11);
    expect(verbs?.jlpt).toBe("N5–N3");
    expect(verbs?.levels).toEqual(["N5", "N4", "N3"]);
    expect(docs.find((doc) => doc.slug === "jlpt-n5-survival-one-page-reference-sheet")).toBeTruthy();
    for (const doc of docs) {
      expect(fs.existsSync(path.join(process.cwd(), "public", doc.imageUrl))).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), "public", doc.fallbackSvgUrl))).toBe(true);
    }
  });

  it("returns document content and an ordered heading outline", () => {
    const doc = getLearnDocBySlug("japanese-verb-forms-table");

    expect(doc?.content).toContain("Form-by-form reference");
    expect(doc?.headings.length).toBeGreaterThan(0);
    expect(doc?.headings[0]).toMatchObject({ level: 2, id: "form-by-form-reference" });
    expect(doc?.headings.some((heading) => heading.level === 3)).toBe(true);
  });

  it("compiles every published guide as MDX", async () => {
    const docs = getAllLearnDocs();
    for (const metadata of docs) {
      const doc = getLearnDocBySlug(metadata.slug);
      if (!doc) throw new Error(`Missing guide ${metadata.slug}.`);
      try {
        await serialize(doc.content, { mdxOptions: { remarkPlugins: [remarkGfm] } });
      } catch (error) {
        throw new Error(`Could not compile ${metadata.slug}: ${String(error)}`);
      }
    }
  }, 30000);
});
