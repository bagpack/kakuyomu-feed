import request = require("request-promise-native");
import { Feed } from "feed";

import parseKakuyomu from "./parser";
import Work from "./work";

export default async function getFeed(url): Promise<Feed> {
  const htmlStr = await request(url);
  const work = parseKakuyomu(htmlStr);
  return createFeed(work);
}

function createFeed(work: Work): Feed {
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
    feed: null,
    feedLinks: null,
    copyright: null
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
