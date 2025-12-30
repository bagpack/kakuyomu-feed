import { promises as fs } from "fs";
import * as path from "path";

const CACHE_DIR = path.join(process.cwd(), "cache");

type CacheEntry = {
  expiresAt: number;
  value: string;
};

function buildCachePath(id: string, extension: string): string {
  const key = `${id}.${extension}`;
  return path.join(CACHE_DIR, `${encodeURIComponent(key)}.json`);
}

export async function get(
  id: string,
  extension: string
): Promise<string | null> {
  const filePath = buildCachePath(id, extension);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry.expiresAt || entry.expiresAt <= Date.now()) {
      await fs.unlink(filePath).catch(() => undefined);
      return null;
    }
    return entry.value;
  } catch (error) {
    return null;
  }
}

export async function set(
  id: string,
  extension: string,
  value: string,
  ttl: number
): Promise<string> {
  const filePath = buildCachePath(id, extension);
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const entry: CacheEntry = {
    expiresAt: Date.now() + ttl * 1000,
    value
  };
  await fs.writeFile(filePath, JSON.stringify(entry), "utf8");
  return value;
}
