# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install -g grunt-cli && npm install

COPY . .
RUN grunt

# gruntfile.js hardcodes releasePath (e.g. "stable/6.0"), which can drift from
# package.json's version. Normalize the freshly-built output to a fixed path
# instead of hardcoding that version string here.
RUN latest_dir="$(ls -td release/stable/*/ | head -1)" \
    && mkdir -p /dist \
    && cp -r "${latest_dir}standalone" /dist/standalone

FROM nginx:alpine
COPY --from=build /dist/standalone /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://localhost/ || exit 1

EXPOSE 80
