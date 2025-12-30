import request = require("supertest");
import type { Feed } from "feed";

import { app } from "../src/index";
import getFeed from "../src/feed";
import * as cache from "../src/feedcache";

jest.mock("../src/feed");
jest.mock("../src/feedcache");

const getFeedMock = getFeed as jest.MockedFunction<typeof getFeed>;
const cacheGetMock = cache.get as jest.MockedFunction<typeof cache.get>;
const cacheSetMock = cache.set as jest.MockedFunction<typeof cache.set>;

describe("GET /feed/:id", () => {
  beforeEach(() => {
    cacheGetMock.mockResolvedValue(null);
    cacheSetMock.mockResolvedValue("ok");
  });

  it("returns cached feed when cache is hit", async () => {
    cacheGetMock.mockResolvedValue("cached-feed");

    const response = await request(app).get("/feed/123.atom");

    expect(response.text).toBe("cached-feed");
    expect(getFeedMock).not.toHaveBeenCalled();
  });

  it("fetches and caches feed on cache miss", async () => {
    const fakeFeed = {
      atom1: () => "<feed/>",
      rss2: () => "<rss/>",
      json1: () => "{}"
    } as Feed;
    getFeedMock.mockResolvedValue(fakeFeed);

    const response = await request(app).get("/feed/123.atom");

    expect(response.text).toBe("<feed/>");
    expect(getFeedMock).toHaveBeenCalledWith("https://kakuyomu.jp/works/123");
    expect(cacheSetMock).toHaveBeenCalled();
  });
});
