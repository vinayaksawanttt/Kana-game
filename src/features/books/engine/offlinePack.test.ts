import { describe, expect, it } from "vitest";
import { collectTextbookOfflineAssetUrls } from "./offlinePack";

describe("collectTextbookOfflineAssetUrls", () => {
  it("includes book JSONs, covers, dialogue backgrounds, avatars, and dialogue audio", () => {
    const urls = collectTextbookOfflineAssetUrls();
    const urlSet = new Set(urls);

    // Deduplicated
    expect(urls.length).toBe(urlSet.size);

    // Core book data & covers
    expect(urlSet.has("/data/v1/books/genki-1.json")).toBe(true);
    expect(urlSet.has("/data/v1/books/genki-2.json")).toBe(true);
    expect(urlSet.has("/data/v1/books/mnn-1.json")).toBe(true);
    expect(urlSet.has("/data/v1/books/mnn-2.json")).toBe(true);
    expect(urlSet.has("/images/books/genki-1.webp")).toBe(true);

    // Backgrounds & character avatars
    expect(urls.some((u) => u.startsWith("/images/books/backgrounds/"))).toBe(true);
    expect(urls.some((u) => u.startsWith("/images/characters/") && u.endsWith("/neutral.webp"))).toBe(true);
    expect(urls.some((u) => u.startsWith("/images/characters/") && u.endsWith("/talking.webp"))).toBe(true);

    // Dialogue audio clips (191 Genki 1 + 183 Genki 2 + 1080 MNN 1 + 560 MNN 2 = 2014)
    const audioUrls = urls.filter((u) => u.startsWith("/audio/books/dialogues/"));
    expect(audioUrls.length).toBe(2014);
  });
});
