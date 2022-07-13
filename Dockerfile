FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV TZ=UTC

CMD ["node", "main.js"]