FROM node:12.11.1-alpine AS build-env

WORKDIR /work

ADD package.json .
ADD yarn.lock .
ADD tsconfig.json .
ADD src/ src/
RUN apk add yarn && yarn install && yarn run build

FROM node:12.11.1-alpine

COPY --from=build-env /work .

CMD [ "node" , "dist/index.js"]
