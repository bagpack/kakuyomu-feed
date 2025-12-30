import { fetch } from "undici";
import parseKakuyomu from "../src/parser";

const WORK_ID = "4852201425154978794";
const WORK_URL = `https://kakuyomu.jp/works/${WORK_ID}`;

describe("parser integration", () => {
  it("fetches real work data and parses episodes", async () => {
    jest.setTimeout(20000);
    const response = await fetch(WORK_URL);
    expect(response.ok).toBe(true);
    const html = await response.text();
    const work = parseKakuyomu(html);

    expect(work.url).toBe(WORK_URL);
    expect(work.title).toBeTruthy();
    expect(work.author).toBeTruthy();
    expect(work.episodes.length).toBeGreaterThan(0);
  });
});
