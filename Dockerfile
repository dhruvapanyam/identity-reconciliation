FROM node:18.16

WORKDIR /app
COPY . /app

RUN npm install

EXPOSE 8080
CMD [ "npm", "start" ]