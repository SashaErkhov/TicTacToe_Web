FROM nginx:1.29.4-alpine3.23

RUN addgroup -S app && adduser -S app -G app

RUN rm /etc/nginx/conf.d/default.conf \
    && sed -i 's|pid .*;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/cache/nginx/client_temp \
         /var/cache/nginx/proxy_temp \
         /var/cache/nginx/fastcgi_temp \
         /var/cache/nginx/uwsgi_temp \
         /var/cache/nginx/scgi_temp \
    && chown -R app:app /var/cache/nginx /var/run /etc/nginx \
    && chmod -R 755 /var/cache/nginx /var/run

USER app

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
