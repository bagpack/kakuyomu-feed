import parseKakuyomu from "../src/parser";

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
          <li class="widget-toc-episode">
            <a href="/works/123/episodes/2">
              <span>Episode 2</span>
              <time datetime="2023-01-04T00:00:00+09:00"></time>
            </a>
          </li>
        </ol>
      </div>
    </section>
  </body>
</html>
`;

describe("parseKakuyomu", () => {
  it("parses work metadata and episodes", () => {
    const work = parseKakuyomu(sampleHtml);

    expect(work.title).toBe("Sample Title");
    expect(work.description).toBe("Sample Description");
    expect(work.url).toBe("https://kakuyomu.jp/works/123");
    expect(work.image).toBe("https://example.com/image.jpg");
    expect(work.favicon).toBe("https://example.com/icon.ico");
    expect(work.author).toBe("Sample Author");
    expect(work.updated.toISOString()).toBe("2023-01-01T18:04:05.000Z");

    expect(work.episodes).toHaveLength(2);
    expect(work.episodes[0].subtitle).toBe("Episode 1");
    expect(work.episodes[0].url).toBe(
      "https://kakuyomu.jp/works/123/episodes/1"
    );
    expect(work.episodes[1].subtitle).toBe("Episode 2");
    expect(work.episodes[1].url).toBe(
      "https://kakuyomu.jp/works/123/episodes/2"
    );
  });
});
