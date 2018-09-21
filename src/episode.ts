export default class Episode {
  readonly id: string;
  readonly subtitle: string;
  readonly url: string;
  readonly updated: Date;

  constructor(id, subtitle, url, updated) {
    this.id = id;
    this.subtitle = subtitle;
    this.url = url;
    this.updated = updated;
  }
}
