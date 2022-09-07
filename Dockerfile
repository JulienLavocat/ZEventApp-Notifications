FROM node:16-alpine

WORKDIR /usr/app

COPY package.json .

RUN yarn

COPY . .

RUN yarn build

RUN touch service-account.json

CMD ["yarn", "prod"]