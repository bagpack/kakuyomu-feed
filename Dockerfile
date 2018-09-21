FROM node:10.11.0-alpine AS build-env

WORKDIR /work

ADD package.json .
ADD yarn.lock .
ADD tsconfig.json .
ADD src/ src/
RUN apk add yarn && yarn install && yarn run build

FROM node:10.11.0-alpine

COPY --from=build-env /work .

CMD [ "node" , "dist/index.js"]
