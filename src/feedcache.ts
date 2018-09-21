import CachemanFile = require("cacheman-file");
const cache = new CachemanFile({ tmpDir: "./cache" });

export async function get(id: string, extension: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    cache.get(`${id}${extension}`, (err, value) => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
}

export async function set(
  id: string,
  extension: string,
  value: string,
  ttl: number
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    cache.set(`${id}${extension}`, value, ttl, (err, value) => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
}
