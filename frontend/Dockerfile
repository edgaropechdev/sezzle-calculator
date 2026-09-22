FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm test
RUN npm run build

# Multi-stage: the first stage builds the bundle with Node and runs the tests,
# the second serves the built files with nginx. Node never reaches the shipped
# image — what runs in production is static files and a web server.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80