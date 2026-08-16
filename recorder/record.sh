#!/bin/sh
# Graba clips de la camara cada SEGMENT_SECONDS, registra en la web
# y limpia clips viejos (RETENTION_DAYS).

CLIPS="${CLIPS_DIR:-/clips}"
RTSP_URL="${RTSP_URL:-rtsp://192.168.1.60:8554/patio}"
CAM="${CAMERA:-patio}"
SEG="${SEGMENT_SECONDS:-30}"
DAYS="${RETENTION_DAYS:-5}"
AUDIO="${AUDIO:-1}"
REG_URL="${REGISTER_URL:-}"
CLEAN_URL="${CLEANUP_URL:-}"
TOKEN="${API_TOKEN:-}"

mkdir -p "$CLIPS/tmp"

log() {
    echo "[$(date '+%F %T')] $*"
}

register() {
    # $1=rel $2=size $3=duration $4=start_ts
    [ -z "$REG_URL" ] && return 0
    curl -s -m 10 -X POST "$REG_URL" \
        -H "X-API-Token: $TOKEN" \
        --data-urlencode "camera=$CAM" \
        --data-urlencode "file=$1" \
        --data-urlencode "size=$2" \
        --data-urlencode "duration=$3" \
        --data-urlencode "start_ts=$4" >/dev/null 2>&1 || true
}

cleanup() {
    log "Limpieza: borrando clips de mas de ${DAYS} dias"
    find "$CLIPS" -type f -name '*.mp4' -mtime "+${DAYS}" -delete 2>/dev/null
    find "$CLIPS" -type f -name '*.jpg' -mtime "+${DAYS}" -delete 2>/dev/null
    find "$CLIPS" -type d -empty -delete 2>/dev/null
    [ -z "$CLEAN_URL" ] && return 0
    curl -s -m 10 -X POST "$CLEAN_URL" -H "X-API-Token: $TOKEN" >/dev/null 2>&1 || true
}

AUDIO_ARGS="-an"
[ "$AUDIO" = "1" ] && AUDIO_ARGS="-c:a aac -b:a 64k"

log "Grabador iniciado: camara=$CAM segmento=${SEG}s retencion=${DAYS}d"
log "Fuente: $RTSP_URL"

n=0
while true; do
    YMD=$(date +%Y/%m/%d)
    TS=$(date +%Y%m%d_%H%M%S)
    DIR="$CLIPS/$YMD"
    mkdir -p "$DIR"
    START=$(date +%s)
    NAME="${CAM}_${TS}"
    TMP="$CLIPS/tmp/${NAME}.part.mp4"
    OUT="$DIR/${NAME}.mp4"

    if ffmpeg -hide_banner -loglevel error -y -rtsp_transport tcp \
        -i "$RTSP_URL" -t "$SEG" -c:v copy $AUDIO_ARGS \
        -movflags +faststart "$TMP" 2>/dev/null; then
        mv "$TMP" "$OUT"
        SIZE=$(stat -c%s "$OUT" 2>/dev/null || echo 0)
        DUR=$(ffprobe -v error -show_entries format=duration \
              -of default=nw=1:nk=1 "$OUT" 2>/dev/null || echo 0)
        POSTER="$DIR/${NAME}.jpg"
        ffmpeg -hide_banner -loglevel error -y -ss 1 -i "$OUT" \
            -frames:v 1 -q:v 5 "$POSTER" 2>/dev/null || true
        register "$YMD/${NAME}.mp4" "$SIZE" "$DUR" "$START"
        log "Clip: $YMD/${NAME}.mp4 ($SIZE bytes, ${DUR}s)"
    else
        rm -f "$TMP"
        log "Error de grabacion, reintento en 5s"
        sleep 5
    fi

    n=$((n + 1))
    if [ $((n % 120)) -eq 0 ]; then
        cleanup
    fi
done
