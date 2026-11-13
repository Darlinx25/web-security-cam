#!/bin/bash
# Auto-discovery de camaras FH86xx en la red local.
# Usa Python para escaneo rapido, actualiza go2rtc.yaml,
# y reinicia go2rtc si cambio algo.

CONF="/config/go2rtc.yaml"
USER="${RTSP_USER:-super}"
PASS="${RTSP_PASS:-qianniaosuper}"
SUBNET="${SUBNET:-192.168.1}"
KNOWN_PUERTA="${KNOWN_PUERTA:-192.168.1.6}"
EXCLUDE_IPS="${EXCLUDE_IPS:-192.168.1.1}"
INTERVAL="${INTERVAL:-300}"

log() { echo "[$(date '+%F %T')] $*" >&2; }

scan_network() {
    python3 -c "
import socket, concurrent.futures, os, sys

subnet = '$SUBNET'
exclude = set('${EXCLUDE_IPS} ${KNOWN_PUERTA}'.split())
exclude.add(socket.gethostname())

results = []
def check(ip):
    try:
        s = socket.create_connection((ip, 8554), timeout=0.3)
        s.close()
        return ip
    except:
        return None

ips = [f'{subnet}.{i}' for i in range(1, 51)]
with concurrent.futures.ThreadPoolExecutor(30) as ex:
    for r in ex.map(check, ips):
        if r and r not in exclude:
            print(r)
            sys.stdout.flush()
" 2>/dev/null
}

generate_config() {
    local all_ips="$1"

    local patio_lines=""
    for ip in $all_ips; do
        patio_lines="${patio_lines}    - rtsp://$USER:$PASS@$ip:8554/profile0#transport=tcp\n"
    done
    [ -z "$patio_lines" ] && patio_lines="    - rtsp://$USER:$PASS@$SUBNET.5:8554/profile0#transport=tcp\n    - rtsp://$USER:$PASS@$SUBNET.2:8554/profile0#transport=tcp\n"

    local puerta_lines="    - rtsp://$USER:$PASS@$KNOWN_PUERTA:8554/profile0#transport=tcp\n"

    cat > "$CONF" << ENDCONF
api:
  listen: ":1984"
rtsp:
  listen: ":8554"
webrtc:
  listen: ":8555"

streams:
  patio:
$(echo -e "$patio_lines" | sed '/^$/d')
  puerta:
$(echo -e "$puerta_lines" | sed '/^$/d')
ENDCONF
}

restart_go2rtc() {
    if [ -S /var/run/docker.sock ]; then
        local cid=$(curl -s --unix-socket /var/run/docker.sock \
            "http://localhost/containers/json" 2>/dev/null | \
            grep -o '"Id":"[^"]*"' | while read line; do
                local id=$(echo "$line" | sed 's/"Id":"//;s/"//' | cut -c1-12)
                local names=$(curl -s --unix-socket /var/run/docker.sock \
                    "http://localhost/containers/$id/json" 2>/dev/null | \
                    grep -o '"Name":"[^"]*"' | head -1)
                if echo "$names" | grep -q "go2rtc"; then
                    echo "$id"
                    break
                fi
            done)
        if [ -n "$cid" ]; then
            log "Restarting go2rtc ($cid)..."
            curl -s -X POST --unix-socket /var/run/docker.sock \
                "http://localhost/containers/$cid/restart" >/dev/null 2>&1
            log "go2rtc restarted."
        else
            log "Could not find go2rtc container."
        fi
    else
        log "Docker socket not found."
    fi
}

run_discovery() {
    log "Scanning $SUBNET.0/24..."
    local camaras=$(scan_network)
    log "Found:$camaras"

    local old_md5=""
    [ -f "$CONF" ] && old_md5=$(md5sum "$CONF" 2>/dev/null | awk '{print $1}')

    generate_config "$camaras"

    local new_md5=$(md5sum "$CONF" 2>/dev/null | awk '{print $1}')
    if [ "$old_md5" != "$new_md5" ]; then
        log "Config changed, restarting go2rtc..."
        restart_go2rtc
    else
        log "Config unchanged."
    fi
}

if [ "$1" = "--once" ]; then
    run_discovery
else
    log "Discovery started (interval: ${INTERVAL}s)"
    while true; do
        run_discovery
        log "Sleeping ${INTERVAL}s..."
        sleep "$INTERVAL"
    done
fi
