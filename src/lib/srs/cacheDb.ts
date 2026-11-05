import Dexie, { type Table } from "dexie";
import type { ShiritoriWord } from "@/engine/shiritori";

export interface CacheMetaRecord {
  key: string;       // e.g. "shiritori/words.json" or "dictionary-index.json"
  hash: string;      // 12-char SHA-256 from manifest.json
  updatedAt: number;
}

export interface CachedDictionaryRecord {
  key: string;
  data: unknown;
  updatedAt: number;
}

export class NihongoCacheDatabase extends Dexie {
  meta!: Table<CacheMetaRecord, string>;
  shiritoriWords!: Table<ShiritoriWord, string>;
  dictionaryMeta!: Table<CachedDictionaryRecord, string>;

  constructor() {
    super("nihongoCacheDb");
    this.version(1).stores({
      meta: "key, hash, updatedAt",
      shiritoriWords: "id, kana, word, startKana, endKana, jlpt",
      dictionaryMeta: "key",
    });
  }
}

export function isIndexedDbAvailable(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

let _dbInstance: NihongoCacheDatabase | null = null;

export function getCacheDb(): NihongoCacheDatabase | null {
  if (!isIndexedDbAvailable()) return null;
  if (!_dbInstance) {
    _dbInstance = new NihongoCacheDatabase();
  }
  return _dbInstance;
}

export const nihongoCacheDb = {
  get db(): NihongoCacheDatabase | null {
    return getCacheDb();
  },
};

export async function getCacheMeta(key: string): Promise<CacheMetaRecord | null> {
  const db = getCacheDb();
  if (!db) return null;
  try {
    const record = await db.meta.get(key);
    return record ?? null;
  } catch {
    return null;
  }
}

export async function saveCacheMeta(record: CacheMetaRecord): Promise<void> {
  const db = getCacheDb();
  if (!db) return;
  try {
    await db.meta.put(record);
  } catch {
    // Ignore cache persistence errors
  }
}

export async function getShiritoriWordsFromCache(): Promise<ShiritoriWord[] | null> {
  const db = getCacheDb();
  if (!db) return null;
  try {
    const count = await db.shiritoriWords.count();
    if (count === 0) return null;
    return await db.shiritoriWords.toArray();
  } catch {
    return null;
  }
}

export async function saveShiritoriWordsToCache(
  words: ShiritoriWord[],
  hash: string
): Promise<void> {
  const db = getCacheDb();
  if (!db) return;
  try {
    await db.transaction("rw", db.shiritoriWords, db.meta, async () => {
      await db.shiritoriWords.clear();
      const CHUNK_SIZE = 2000;
      for (let i = 0; i < words.length; i += CHUNK_SIZE) {
        await db.shiritoriWords.bulkPut(words.slice(i, i + CHUNK_SIZE));
      }
      await db.meta.put({
        key: "shiritori/words.json",
        hash,
        updatedAt: Date.now(),
      });
    });
  } catch (err) {
    console.warn("Failed to cache shiritori words in Dexie:", err);
  }
}

export async function getDictionaryIndexFromCache<T = unknown>(): Promise<T | null> {
  const db = getCacheDb();
  if (!db) return null;
  try {
    const record = await db.dictionaryMeta.get("dictionary-index.json");
    if (!record || !record.data) return null;
    return record.data as T;
  } catch {
    return null;
  }
}

export async function saveDictionaryIndexToCache(
  data: unknown,
  hash: string
): Promise<void> {
  const db = getCacheDb();
  if (!db) return;
  try {
    await db.transaction("rw", db.dictionaryMeta, db.meta, async () => {
      await db.dictionaryMeta.put({
        key: "dictionary-index.json",
        data,
        updatedAt: Date.now(),
      });
      await db.meta.put({
        key: "dictionary-index.json",
        hash,
        updatedAt: Date.now(),
      });
    });
  } catch (err) {
    console.warn("Failed to cache dictionary index in Dexie:", err);
  }
}

