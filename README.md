kakuyomu-feed
=======

Generate Atom/RSS feeds for Kakuyomu works.

I'm frustrated that [Kakuyomu](https://kakuyomu.jp/) doesn't provide RSS feeds.
So this project generates RSS/Atom feeds for Kakuyomu.

# Features

- Support Atom1.0 and RSS2.0(by [jpmonette/feed](https://github.com/jpmonette/feed))
- Response Caching
- Lightweight HTTP API

# Getting Started

## Requirements

- Node.js 20
- Yarn (or use `npx yarn`)

## Usage

```
GET /feed/:work_id.atom
GET /feed/:work_id.rss
```

Example work:

```
https://kakuyomu.jp/works/4852201425154978794
```

Curl:

```
$ curl https://[your-domain]/feed/4852201425154978794.rss
```

## Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/bagpack/kakuyomu-feed)

## Build Manually

```
$ yarn run docker-build
$ yarn run docker-run
```

## Development

```
$ npx yarn install
$ npx yarn test
```

Local server:

```
$ npx yarn build
$ node dist/index.js
```

## CI

GitHub Actions runs `yarn test` and verifies Docker builds.

## Cache

Feed responses are cached under `./cache` (relative to the project root). Ensure this directory is writable in your runtime environment, or mount a persistent volume in Docker/Heroku if you want cache retention across restarts.

## Environment Variables

`CACHE_TTL_SEC` controls cache TTL in seconds (default: 600).

## Root Endpoint

`/` returns a short usage message.

# Reference

[カクヨムの小説更新情報をRSSで配信するコンテナ](https://github.com/tetosuna/kakuyomu-rss-gen)
