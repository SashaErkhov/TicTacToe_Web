FROM nginx:1.29.4-alpine3.23

RUN addgroup -S app && adduser -S app -G app

RUN rm /etc/nginx/conf.d/default.conf \
    && sed -i 's|pid .*;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf

COPY nginx.conf /etc/nginx/nginx.conf

RUN chown -R app:app /usr/share/nginx/html /var/cache/nginx /var/run /run

USER app

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
