import * as xpath from "xpath";
import { DOMParser as dom } from "xmldom";
import * as urlParser from "url";

import Work from "./work";
import Episode from "./episode";

export default (html: string) => {
  const doc = new dom().parseFromString(html);
  return parseWork(doc);
};

function parseWork(doc: Document): Work {
  const title = (xpath.select(
    '//meta[@property="og:title"]',
    doc
  )[0] as Element).getAttribute("content");
  const author: string = (xpath.select(
    '//span[@id="workAuthor-activityName"]/a',
    doc
  )[0] as Element).textContent;
  const url: string = (xpath.select(
    '//meta[@property="og:url"]',
    doc
  )[0] as Element).getAttribute("content");
  const image: string = (xpath.select(
    '//meta[@property="og:image"]',
    doc
  )[0] as Element).getAttribute("content");
  const updatedStr = (xpath.select(
    '//p[@class="widget-toc-date"]/time',
    doc
  )[0] as Element).getAttribute("datetime");
  const description = (xpath.select(
    '//meta[@property="og:description"]',
    doc
  )[0] as Element).getAttribute("content");
  const icon = (xpath.select(
    '//link[@rel="icon"]',
    doc
  )[0] as Element).getAttribute("href");

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
  const rootUrl = `${urlParser.parse(url).protocol}//${
    urlParser.parse(url).host
  }`;
  work.addEpisodes(parseEpisodes(rootUrl, doc));

  return work;
}

function parseEpisodes(rootUrl: string, doc: Document): Episode[] {
  const episodeValues = xpath.select(
    '//section[@class="widget-toc"]/div/ol/li[@class="widget-toc-episode"]',
    doc
  );
  const episodes = [];
  for (const episodeValue of episodeValues) {
    const episodeNode = episodeValue as Node;
    const subtitle = (xpath.select(".//a/span", episodeNode)[0] as Element)
      .textContent;
    const link =
      rootUrl +
      (xpath.select(".//a/@href", episodeNode)[0] as Element).textContent;
    const dateStr = (xpath.select(
      ".//a/time/@datetime",
      episodeNode
    )[0] as Element).textContent;

    episodes.push(new Episode(link, subtitle, link, new Date(dateStr)));
  }

  return episodes;
}
