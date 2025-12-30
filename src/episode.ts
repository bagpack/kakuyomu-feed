export default class Episode {
  readonly id: string;
  readonly subtitle: string;
  readonly url: string;
  readonly updated: Date;

  constructor(id: string, subtitle: string, url: string, updated: Date) {
    this.id = id;
    this.subtitle = subtitle;
    this.url = url;
    this.updated = updated;
  }
}
