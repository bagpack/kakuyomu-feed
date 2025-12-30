import Episode from "./episode";

export default class Work {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly image: string;
  readonly favicon: string;
  readonly author: string;
  readonly updated: Date;
  episodes: Episode[] = [];

  constructor(
    id: string,
    title: string,
    description: string,
    url: string,
    image: string,
    favicon: string,
    author: string,
    updated: Date
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.url = url;
    this.image = image;
    this.favicon = favicon;
    this.author = author;
    this.updated = updated;
  }

  addEpisodes(episodes: Episode[]): void {
    this.episodes = this.episodes.concat(episodes);
  }
}
