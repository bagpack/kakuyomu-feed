import * as Express from "express";
const app = Express();
import pathToRegexp = require("path-to-regexp");

import * as cache from "./feedcache";
import getFeed from "./feed";

const KAKUYOMU_EPISODE_BASE = "https://kakuyomu.jp/works";
const FEED_DEFAULT_FORMAT = "atom";
const CACHE_TTL_SEC: number = +process.env.CACHE_TTL_SEC || 60 * 10;

const PORT = process.env.PORT || "3000";

process.on("unhandledRejection", console.dir);

app.get("/feed/:id", function(req, res) {
  const re = pathToRegexp("/feed/:id.:extension(atom|rss)?");
  const exp = re.exec(req.url);
  const id = exp[1];
  const extension = exp[2] ? exp[2] : FEED_DEFAULT_FORMAT;

  (async () => {
    const feedCache = await cache.get(id, extension);
    if (feedCache !== null) {
      res.send(feedCache);
      return;
    }
    const feed = await getFeed(`${KAKUYOMU_EPISODE_BASE}/${id}`).catch(e => {
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
app.listen(PORT);
