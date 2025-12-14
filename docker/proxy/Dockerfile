FROM node:18-bullseye

WORKDIR /app

# Copy package metadata and install production deps
COPY package*.json ./
RUN npm install --production

# Copy the proxy script
COPY websocket-proxy.js ./

EXPOSE 8080

CMD ["node", "websocket-proxy.js"]
