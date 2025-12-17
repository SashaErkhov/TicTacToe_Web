# ---------- build stage ----------
FROM node:24.12.0-alpine3.22 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# ---------- runtime stage ----------
FROM nginx:1.29.4-alpine3.23

RUN addgroup -S app && adduser -S app -G app

RUN rm /etc/nginx/conf.d/default.conf \
 && sed -i 's|pid .*;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf

COPY nginx.conf /etc/nginx/conf.d/app.conf

COPY --from=build /app/dist /usr/share/nginx/html

RUN chown -R app:app /usr/share/nginx/html /var/cache/nginx /var/run

USER app

EXPOSE 1234
CMD ["nginx", "-g", "daemon off;"]
