import * as Express from "express";
export const app = Express();
import pathToRegexp = require("path-to-regexp");

import * as cache from "./feedcache";
import getFeed from "./feed";

const KAKUYOMU_EPISODE_BASE = "https://kakuyomu.jp/works";
const FEED_DEFAULT_FORMAT = "rss";
const CACHE_TTL_SEC = Number.isFinite(Number(process.env.CACHE_TTL_SEC))
  ? Number(process.env.CACHE_TTL_SEC)
  : 60 * 10;

const PORT = process.env.PORT || "3000";

process.on("unhandledRejection", console.dir);

app.get("/", function(req: Express.Request, res: Express.Response) {
  res.type("text/plain");
  res.send(
    [
      "Kakuyomu feed usage:",
      "GET /feed/:work_id.atom",
      "GET /feed/:work_id.rss",
      "Example:",
      "https://kakuyomu.jp/works/4852201425154978794"
    ].join("\n")
  );
});

app.get("/feed/:id", function(req: Express.Request, res: Express.Response) {
  const re = pathToRegexp("/feed/:id.:extension(atom|rss)?");
  const exp = re.exec(req.url);
  if (!exp) {
    res.statusCode = 400;
    res.send();
    return;
  }
  const id = exp[1];
  const extension = exp[2] ? exp[2] : FEED_DEFAULT_FORMAT;

  (async () => {
    const feedCache = await cache.get(id, extension);
    if (feedCache !== null) {
      res.send(feedCache);
      return;
    }
    const feed = await getFeed(`${KAKUYOMU_EPISODE_BASE}/${id}`).catch(() => {
      console.log(`not found id:${id}`);
      return null;
    });
    if (feed === null) {
      res.statusCode = 404;
      res.send();
      return;
    }
    res.header("Content-Type", "application/rss+xml;charset=utf-8");
    if (extension === "atom") {
      const atom = feed.atom1();
      res.send(atom);
      cache.set(id, extension, atom, CACHE_TTL_SEC);
    } else {
      const rss = feed.atom1();
      res.send(rss);
      cache.set(id, extension, rss, CACHE_TTL_SEC);
    }
  })();
});
if (require.main === module) {
  app.listen(PORT);
}
