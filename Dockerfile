FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install

COPY . .

RUN yarn build


ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

CMD ["node", "dist/main"]
