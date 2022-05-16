FROM node:16
WORKDIR /todo-list-server
COPY package.json .
RUN npm install
COPY . .
CMD npm start