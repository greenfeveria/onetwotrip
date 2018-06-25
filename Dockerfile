FROM node:alpine
COPY ./source/package*.json ./usr/src/app/
WORKDIR /usr/src/app
RUN npm install --production
COPY ./source /usr/src/app
CMD ["npm", "start"]