FROM node:18-bullseye AS build
WORKDIR /app

# Install and build the frontend
COPY web-react/package*.json ./
RUN npm ci --silent
COPY web-react/ ./
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
