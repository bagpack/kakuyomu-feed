kakuyomu-feed
=======

I'm angry about that [Kakuyomu](https://kakuyomu.jp/) does not support RSS feed.
So, we make RSS feed of Kakuyomu.


# Features

- Support Atom1.0 and RSS2.0(by [jpmonette/feed](https://github.com/jpmonette/feed))
- Response Caching

# Getting Started

## Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/bagpack/kakuyomu-feed)

## Build Manually

```
$ yarn run docker-build
$ yarn run docker-run
```

# API

```
https://[your-domain]/feed/[work_id].[rss|atom]
```

`work_id` is a number after works.

```
ex)
https://kakuyomu.jp/works/4852201425154978794
```

Curl request sample.

```
$ curl https://[your-domain]/feed/4852201425154978794.rss
```

# Reference

[カクヨムの小説更新情報をRSSで配信するコンテナ](https://github.com/tetosuna/kakuyomu-rss-gen)
