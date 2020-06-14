FROM node:latest

WORKDIR /usr/src/app

COPY package*.json yarn.lock ./

RUN yarn install && yarn cache clean

COPY . .

EXPOSE 3000
CMD [ "yarn", "start" ]
