import getFeed from "../src/feed";
import { fetch } from "undici";
import type { Response } from "undici";

jest.mock("undici", () => ({ fetch: jest.fn() }));

const sampleHtml = `
<!doctype html>
<html>
  <head>
    <meta property="og:title" content="Sample Title" />
    <meta property="og:url" content="https://kakuyomu.jp/works/123" />
    <meta property="og:image" content="https://example.com/image.jpg" />
    <meta property="og:description" content="Sample Description" />
    <link rel="icon" href="https://example.com/icon.ico" />
  </head>
  <body>
    <span id="workAuthor-activityName"><a>Sample Author</a></span>
    <p class="widget-toc-date">
      <time datetime="2023-01-02T03:04:05+09:00"></time>
    </p>
    <section class="widget-toc">
      <div>
        <ol>
          <li class="widget-toc-episode">
            <a href="/works/123/episodes/1">
              <span>Episode 1</span>
              <time datetime="2023-01-03T00:00:00+09:00"></time>
            </a>
          </li>
        </ol>
      </div>
    </section>
  </body>
</html>
`;

describe("getFeed", () => {
  it("creates a feed from fetched HTML", async () => {
    const fetchMock = fetch as jest.MockedFunction<typeof fetch>;
    const response = {
      ok: true,
      text: async () => sampleHtml
    } as unknown as Response;
    fetchMock.mockResolvedValue(response);

    const feed = await getFeed("https://kakuyomu.jp/works/123");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://kakuyomu.jp/works/123"
    );
    expect(feed.options.title).toBe("Sample Title");
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].title).toBe("Episode 1");
    expect(feed.items[0].link).toBe(
      "https://kakuyomu.jp/works/123/episodes/1"
    );
  });
});
