FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm test
RUN npm run build

# It desides to use nginx as a web server to serve the static files built by the frontend application. 
# The Dockerfile uses a multi-stage build process, where the first stage builds the frontend application using Node.js, 
# and the second stage uses the nginx image to serve the built files.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80