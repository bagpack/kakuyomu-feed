import parseKakuyomu from "../src/parser";

const sampleHtml = `
<!doctype html>
<html>
  <head>
    <meta property="og:url" content="https://kakuyomu.jp/works/123" />
    <link rel="icon" href="https://example.com/icon.ico" />
    <script id="__NEXT_DATA__" type="application/json">
      ${JSON.stringify({
        props: {
          pageProps: {
            work: {
              id: "123",
              title: "Sample Title",
              description: "Sample Description",
              author: { name: "Sample Author" },
              imageUrl: "https://example.com/image.jpg",
              url: "https://kakuyomu.jp/works/123",
              updatedAt: "2023-01-02T03:04:05+09:00",
              episodes: [
                {
                  id: "1",
                  title: "Episode 1",
                  publishedAt: "2023-01-03T00:00:00+09:00"
                },
                {
                  id: "2",
                  title: "Episode 2",
                  publishedAt: "2023-01-04T00:00:00+09:00"
                }
              ]
            }
          }
        }
      })}
    </script>
  </head>
  <body></body>
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
