FROM alpine:3.20
RUN apk add --no-cache bash curl python3
COPY discover.sh /discover.sh
RUN chmod +x /discover.sh
ENTRYPOINT ["/discover.sh"]
