import { fetch } from "undici";
import type { Response } from "undici";
import type { Feed as FeedType } from "feed";

import parseKakuyomu from "./parser";
import Work from "./work";

const FETCH_TIMEOUT_MS = 8000;
const FETCH_RETRY_COUNT = 2;
const FETCH_RETRY_DELAY_MS = 500;

export default async function getFeed(url: string): Promise<FeedType> {
  const response = await fetchWithRetry(url, {
    timeoutMs: FETCH_TIMEOUT_MS,
    retries: FETCH_RETRY_COUNT,
    retryDelayMs: FETCH_RETRY_DELAY_MS
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const htmlStr = await response.text();
  const work = parseKakuyomu(htmlStr);
  return await createFeed(work);
}

async function fetchWithRetry(
  url: string,
  {
    timeoutMs,
    retries,
    retryDelayMs
  }: { timeoutMs: number; retries: number; retryDelayMs: number }
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok || response.status < 500 || attempt === retries) {
        return response;
      }
      lastError = new Error(`Request failed: ${response.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;
    }
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
  throw lastError ?? new Error("Request failed");
}

async function createFeed(work: Work): Promise<FeedType> {
  const { Feed } = await import("feed");
  const feed = new Feed({
    title: work.title,
    description: work.description,
    id: work.url,
    link: work.url,
    image: work.image,
    favicon: work.favicon,
    updated: work.updated,
    author: {
      name: work.author
    },
    feed: undefined,
    feedLinks: undefined,
    copyright: ""
  });
  for (const episode of work.episodes) {
    feed.addItem({
      title: episode.subtitle,
      id: episode.id,
      link: episode.url,
      date: episode.updated
    });
  }

  return feed;
}
