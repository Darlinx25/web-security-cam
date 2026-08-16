FROM jrottenberg/ffmpeg:6.1-alpine

RUN apk add --no-cache curl

COPY record.sh /app/record.sh
RUN chmod +x /app/record.sh

ENTRYPOINT []
CMD ["/app/record.sh"]
