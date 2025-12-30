import * as xpath from "xpath";
import { DOMParser as dom } from "@xmldom/xmldom";
import { URL } from "url";

import Work from "./work";
import Episode from "./episode";

export default (html: string) => {
  const doc = new dom().parseFromString(html);
  const nextData = parseNextData(doc);
  if (nextData) {
    const work = parseWorkFromNextData(nextData, doc);
    if (work) {
      return work;
    }
  }
  try {
    return parseWorkFromLegacyHtml(doc);
  } catch (error) {
    throw new Error("Failed to parse work data from HTML");
  }
};

function parseWorkFromLegacyHtml(doc: Document): Work {
  const title = getRequiredAttribute(
    doc,
    '//meta[@property="og:title"]',
    "content"
  );
  const author = getRequiredText(doc, '//span[@id="workAuthor-activityName"]/a');
  const url = getRequiredAttribute(doc, '//meta[@property="og:url"]', "content");
  const image = getRequiredAttribute(
    doc,
    '//meta[@property="og:image"]',
    "content"
  );
  const updatedStr = getRequiredAttribute(
    doc,
    '//p[@class="widget-toc-date"]/time',
    "datetime"
  );
  const description = getRequiredAttribute(
    doc,
    '//meta[@property="og:description"]',
    "content"
  );
  const icon = getRequiredAttribute(doc, '//link[@rel="icon"]', "href");

  const work = new Work(
    url,
    title,
    description,
    url,
    image,
    icon,
    author,
    new Date(updatedStr)
  );
  const rootUrl = new URL(url).origin;
  work.addEpisodes(parseEpisodes(rootUrl, doc));

  return work;
}

function parseWorkFromNextData(nextData: unknown, doc: Document): Work | null {
  const pageProps = getPageProps(nextData);
  if (!pageProps) {
    return null;
  }
  const apolloState = getApolloState(pageProps);
  if (apolloState) {
    const work = parseWorkFromApollo(apolloState, doc);
    if (work) {
      return work;
    }
  }
  const workData = findWorkData(pageProps);
  if (!workData) {
    return null;
  }

  const fallbackUrl = getAttributeOrNull(doc, '//meta[@property="og:url"]', "content");
  const url = getString(workData, [
    "url",
    "workUrl",
    "canonicalUrl",
    "publicUrl"
  ]) ?? fallbackUrl;
  if (!url) {
    return null;
  }
  const title =
    getString(workData, ["title", "workTitle"]) ??
    getAttributeOrNull(doc, '//meta[@property="og:title"]', "content");
  const description =
    getString(workData, ["description", "catchphrase", "summary"]) ??
    getAttributeOrNull(doc, '//meta[@property="og:description"]', "content") ??
    "";
  const image =
    getString(workData, ["imageUrl", "coverUrl", "image", "coverImageUrl"]) ??
    getAttributeOrNull(doc, '//meta[@property="og:image"]', "content") ??
    "";
  const author =
    getAuthorName(workData) ??
    getTextOrNull(doc, '//span[@id="workAuthor-activityName"]/a') ??
    "";
  const icon =
    getString(workData, ["icon", "favicon"]) ??
    getAttributeOrNull(doc, '//link[@rel="icon"]', "href") ??
    "";

  const episodes = parseEpisodesFromNextData(url, pageProps, workData);
  const updated =
    getDateFromWork(workData) ??
    getLatestEpisodeDate(episodes) ??
    new Date();

  const work = new Work(url, title ?? "", description, url, image, icon, author, updated);
  work.addEpisodes(episodes);
  return work;
}

function parseWorkFromApollo(
  apolloState: Record<string, unknown>,
  doc: Document
): Work | null {
  const url =
    getAttributeOrNull(doc, '//meta[@property="og:url"]', "content") ??
    getAttributeOrNull(doc, '//link[@rel="canonical"]', "href");
  if (!url) {
    return null;
  }
  const workId = extractWorkId(url);
  if (!workId) {
    return null;
  }
  const workKey = `Work:${workId}`;
  const workData = apolloState[workKey];
  if (!isRecord(workData)) {
    return null;
  }
  const author = getAuthorNameFromApollo(workData, apolloState) ?? "";
  const title = getString(workData, ["title"]) ?? "";
  const description =
    getString(workData, ["introduction", "catchphrase"]) ??
    getAttributeOrNull(doc, '//meta[@property="og:description"]', "content") ??
    "";
  const image =
    getString(workData, [
      "ogImageUrl",
      "promotionalImageUrl",
      "adminCoverImageUrl",
      "adminSquareImageUrl"
    ]) ??
    getAttributeOrNull(doc, '//meta[@property="og:image"]', "content") ??
    "";
  const icon =
    getAttributeOrNull(doc, '//link[@rel="icon"]', "href") ?? "";

  const episodes = parseEpisodesFromApollo(workData, apolloState, url);
  const updated =
    getDateFromWork(workData) ??
    getLatestEpisodeDate(episodes) ??
    new Date();

  const work = new Work(url, title, description, url, image, icon, author, updated);
  work.addEpisodes(episodes);
  return work;
}

function parseEpisodes(rootUrl: string, doc: Document): Episode[] {
  const episodeValues = xpath.select(
    '//section[@class="widget-toc"]/div/ol/li[@class="widget-toc-episode"]',
    doc
  ) as Node[];
  const episodes: Episode[] = [];
  for (const episodeValue of episodeValues) {
    const episodeNode = episodeValue as Node;
    const subtitle = getRequiredText(episodeNode, ".//a/span");
    const linkPath = getRequiredText(episodeNode, ".//a/@href");
    const dateStr = getRequiredText(episodeNode, ".//a/time/@datetime");
    const link = `${rootUrl}${linkPath}`;
    const episodeId = extractEpisodeId(linkPath);

    episodes.push(
      new Episode(episodeId ?? link, subtitle, link, new Date(dateStr))
    );
  }

  return episodes;
}

function parseEpisodesFromNextData(
  workUrl: string,
  pageProps: Record<string, unknown>,
  workData: Record<string, unknown>
): Episode[] {
  const rootUrl = new URL(workUrl).origin;
  const episodeList =
    getArray(workData, ["episodes", "episodeList", "toc", "tableOfContents"]) ??
    getArray(pageProps, ["episodes", "episodeList", "toc", "tableOfContents"]) ??
    findEpisodeArray(pageProps) ??
    [];

  const episodes: Episode[] = [];
  for (const episodeValue of episodeList) {
    if (!isRecord(episodeValue)) {
      continue;
    }
    const subtitle =
      getString(episodeValue, ["subtitle", "title", "episodeTitle", "name"]) ??
      null;
    const id =
      getString(episodeValue, ["id", "episodeId", "identifier", "slug"]) ?? null;
    const linkPath =
      getString(episodeValue, ["url", "link", "path", "episodeUrl"]) ?? null;
    const dateStr =
      getString(episodeValue, [
        "updatedAt",
        "publishedAt",
        "date",
        "publicDate",
        "createdAt"
      ]) ?? null;

    const link = buildEpisodeUrl(rootUrl, workUrl, linkPath, id);
    if (!subtitle || !link) {
      continue;
    }
    const updated = dateStr ? new Date(dateStr) : new Date();
    const episodeId = extractEpisodeId(link) ?? id;
    episodes.push(new Episode(episodeId ?? link, subtitle, link, updated));
  }

  return episodes;
}

function parseEpisodesFromApollo(
  workData: Record<string, unknown>,
  apolloState: Record<string, unknown>,
  workUrl: string
): Episode[] {
  const tocRefs = workData.tableOfContents;
  if (!Array.isArray(tocRefs)) {
    return [];
  }
  const episodes: Episode[] = [];
  for (const tocRef of tocRefs) {
    if (!isRecord(tocRef)) {
      continue;
    }
    const ref = tocRef.__ref;
    if (typeof ref !== "string") {
      continue;
    }
    const toc = apolloState[ref];
    if (!isRecord(toc)) {
      continue;
    }
    const episodeRefs = toc.episodeUnions;
    if (!Array.isArray(episodeRefs)) {
      continue;
    }
    for (const episodeRef of episodeRefs) {
      if (!isRecord(episodeRef)) {
        continue;
      }
      const episodeKey = episodeRef.__ref;
      if (typeof episodeKey !== "string") {
        continue;
      }
      const episodeData = apolloState[episodeKey];
      if (!isRecord(episodeData)) {
        continue;
      }
      const id = getString(episodeData, ["id"]);
      const title = getString(episodeData, ["title"]);
      if (!id || !title) {
        continue;
      }
      const publishedAt =
        getString(episodeData, ["publishedAt", "updatedAt"]) ?? "";
      const link = `${workUrl.replace(/\/$/, "")}/episodes/${id}`;
      const updated = publishedAt ? new Date(publishedAt) : new Date();
      episodes.push(new Episode(id, title, link, updated));
    }
  }
  return episodes;
}

function getRequiredAttribute(
  node: Node,
  query: string,
  attribute: string
): string {
  const element = selectFirst(node, query) as Element;
  const value = element.getAttribute(attribute);
  if (!value) {
    throw new Error(`Missing attribute ${attribute} for ${query}`);
  }
  return value;
}

function getAttributeOrNull(
  node: Node,
  query: string,
  attribute: string
): string | null {
  try {
    return getRequiredAttribute(node, query, attribute);
  } catch (error) {
    return null;
  }
}

function getRequiredText(node: Node, query: string): string {
  const element = selectFirst(node, query);
  const value = element.textContent;
  if (!value) {
    throw new Error(`Missing text for ${query}`);
  }
  return value;
}

function getTextOrNull(node: Node, query: string): string | null {
  try {
    return getRequiredText(node, query);
  } catch (error) {
    return null;
  }
}

function selectFirst(node: Node, query: string): Node {
  const result = xpath.select(query, node) as Node[];
  const first = result[0];
  if (!first) {
    throw new Error(`Missing node for ${query}`);
  }
  return first;
}

function parseNextData(doc: Document): unknown | null {
  const scripts = xpath.select('//script[@id="__NEXT_DATA__"]', doc) as Node[];
  const script = scripts[0] as Element | undefined;
  if (!script || !script.textContent) {
    return null;
  }
  try {
    return JSON.parse(script.textContent);
  } catch (error) {
    return null;
  }
}

function getPageProps(nextData: unknown): Record<string, unknown> | null {
  if (!isRecord(nextData)) {
    return null;
  }
  const props = nextData.props;
  if (isRecord(props) && isRecord(props.pageProps)) {
    return props.pageProps;
  }
  if (isRecord(nextData.pageProps)) {
    return nextData.pageProps;
  }
  return null;
}

function getApolloState(
  pageProps: Record<string, unknown>
): Record<string, unknown> | null {
  const apollo = pageProps.__APOLLO_STATE__;
  if (isRecord(apollo)) {
    return apollo;
  }
  return null;
}

function findWorkData(root: Record<string, unknown>): Record<string, unknown> | null {
  const direct =
    getObject(root, ["work", "workData", "data", "workInfo"]) ??
    getObject(root, ["page", "work"]) ??
    null;
  if (direct) {
    return direct;
  }
  return findObject(root, value => {
    const title = getString(value, ["title", "workTitle"]);
    const author = getAuthorName(value);
    return Boolean(title && author);
  });
}

function getAuthorName(workData: Record<string, unknown>): string | null {
  const author = workData.author;
  if (typeof author === "string") {
    return author;
  }
  if (isRecord(author)) {
    return getString(author, ["name", "activityName", "nickname"]);
  }
  return getString(workData, ["authorName", "author"]);
}

function getAuthorNameFromApollo(
  workData: Record<string, unknown>,
  apolloState: Record<string, unknown>
): string | null {
  const authorRef = workData.author;
  if (isRecord(authorRef)) {
    const ref = authorRef.__ref;
    if (typeof ref === "string") {
      const author = apolloState[ref];
      if (isRecord(author)) {
        return getString(author, ["activityName", "name", "screenName"]);
      }
    }
  }
  return null;
}

function getDateFromWork(workData: Record<string, unknown>): Date | null {
  const dateStr = getString(workData, [
    "updatedAt",
    "lastUpdatedAt",
    "updatedDate",
    "publishedAt",
    "lastEpisodePublishedAt",
    "editedAt"
  ]);
  return dateStr ? new Date(dateStr) : null;
}

function getLatestEpisodeDate(episodes: Episode[]): Date | null {
  if (episodes.length === 0) {
    return null;
  }
  let latest = episodes[0].updated;
  for (const episode of episodes) {
    if (episode.updated > latest) {
      latest = episode.updated;
    }
  }
  return latest;
}

function buildEpisodeUrl(
  rootUrl: string,
  workUrl: string,
  linkPath: string | null,
  id: string | null
): string | null {
  if (linkPath) {
    if (linkPath.startsWith("http")) {
      return linkPath;
    }
    if (linkPath.startsWith("/")) {
      return `${rootUrl}${linkPath}`;
    }
  }
  if (id) {
    if (workUrl.endsWith("/")) {
      return `${workUrl}episodes/${id}`;
    }
    return `${workUrl}/episodes/${id}`;
  }
  return null;
}

function getArray(
  value: Record<string, unknown>,
  keys: string[]
): Array<unknown> | null {
  for (const key of keys) {
    const found = value[key];
    if (Array.isArray(found)) {
      return found;
    }
  }
  return null;
}

function getObject(
  value: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> | null {
  for (const key of keys) {
    const found = value[key];
    if (isRecord(found)) {
      return found;
    }
  }
  return null;
}

function findEpisodeArray(root: Record<string, unknown>): Array<unknown> | null {
  return findArray(root, value => {
    if (!Array.isArray(value) || value.length === 0) {
      return false;
    }
    const first = value[0];
    if (!isRecord(first)) {
      return false;
    }
    return Boolean(
      getString(first, ["id", "episodeId"]) &&
        getString(first, ["title", "subtitle", "episodeTitle"])
    );
  });
}

function findArray(
  root: Record<string, unknown>,
  predicate: (value: Array<unknown>) => boolean
): Array<unknown> | null {
  const queue: Array<unknown> = [root];
  while (queue.length > 0) {
    const current = queue.shift();
    if (Array.isArray(current) && predicate(current)) {
      return current;
    }
    if (isRecord(current)) {
      for (const value of Object.values(current)) {
        queue.push(value);
      }
    } else if (Array.isArray(current)) {
      for (const value of current) {
        queue.push(value);
      }
    }
  }
  return null;
}

function findObject(
  root: Record<string, unknown>,
  predicate: (value: Record<string, unknown>) => boolean
): Record<string, unknown> | null {
  const queue: Array<unknown> = [root];
  while (queue.length > 0) {
    const current = queue.shift();
    if (isRecord(current) && predicate(current)) {
      return current;
    }
    if (isRecord(current)) {
      for (const value of Object.values(current)) {
        queue.push(value);
      }
    } else if (Array.isArray(current)) {
      for (const value of current) {
        queue.push(value);
      }
    }
  }
  return null;
}

function getString(
  value: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const found = value[key];
    if (typeof found === "string" && found.trim().length > 0) {
      return found;
    }
  }
  return null;
}

function extractWorkId(url: string): string | null {
  const match = url.match(/\/works\/(\d+)/);
  return match ? match[1] : null;
}

function extractEpisodeId(link: string): string | null {
  const match = link.match(/episodes\/(\d+)/);
  return match ? match[1] : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
