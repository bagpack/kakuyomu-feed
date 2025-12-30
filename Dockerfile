FROM node:20-alpine AS build-env

WORKDIR /work

COPY package.json yarn.lock tsconfig.json ./
RUN apk add --no-cache yarn && yarn install --frozen-lockfile
COPY src/ src/
RUN yarn run build

FROM node:20-alpine

COPY --from=build-env /work .

CMD [ "node" , "dist/index.js"]
