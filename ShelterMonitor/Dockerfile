FROM node:25

WORKDIR /ShelterMonitor
COPY package*.json .
RUN npm install
COPY . .
CMD ["npm", "start"]