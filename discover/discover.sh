#!/bin/bash
# Auto-discovery de camaras FH86xx en la red local.
# Detecta cada camara por su MAC (aunque el router le cambie la IP),
# actualiza go2rtc.yaml y reinicia go2rtc si cambio algo.

CONF="/config/go2rtc.yaml"
USER="${RTSP_USER:-super}"
PASS="${RTSP_PASS:-qianniaosuper}"
SUBNET="${SUBNET:-192.168.1}"
KNOWN_PATIO="${KNOWN_PATIO:-192.168.1.2}"
KNOWN_PUERTA="${KNOWN_PUERTA:-192.168.1.3}"
PATIO_MAC="${PATIO_MAC:-cc:b8:5e:3c:80:f6}"
PUERTA_MAC="${PUERTA_MAC:-0c:c1:19:64:57:76}"
EXCLUDE_IPS="${EXCLUDE_IPS:-192.168.1.1 192.168.1.9 192.168.1.60}"
INTERVAL="${INTERVAL:-300}"
FALLBACK_FROM="${PUERTA_FALLBACK_FROM:-2}"
FALLBACK_TO="${PUERTA_FALLBACK_TO:-15}"

log() { echo "[$(date '+%F %T')] $*" >&2; }

scan_network() {
    python3 -c "
import socket, concurrent.futures, sys

subnet = '$SUBNET'
exclude = set('${EXCLUDE_IPS}'.split())

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

get_mac() {
    local ip="$1"
    local mac
    mac=$(awk -v ip="$ip" '$1 == ip { print tolower($4); exit }' /proc/net/arp 2>/dev/null)
    if [ -z "$mac" ]; then
        mac=$(ip neigh show "$ip" 2>/dev/null | awk '{print tolower($5); exit}')
    fi
    echo "$mac"
}

# Devuelve la IP de la camara cuya MAC coincide, o nada si no aparece.
find_camera_ip() {
    local all_ips="$1"
    local want_mac="$2"
    local ip mac
    for ip in $all_ips; do
        mac=$(get_mac "$ip")
        if [ "$mac" = "$want_mac" ]; then
            echo "$ip"
            return 0
        fi
    done
}

generate_config() {
    local patio_ip="$1"
    local puerta_ip="$2"
    local patio_lines=""
    local puerta_lines=""
    local i ip

    patio_lines="    - rtsp://$USER:$PASS@$patio_ip:8554/profile0#transport=tcp\n"

    # Fuente principal de la puerta + reservas por si el router le cambia la IP.
    puerta_lines="    - rtsp://$USER:$PASS@$puerta_ip:8554/profile0#transport=tcp\n"
    for i in $(seq "$FALLBACK_FROM" "$FALLBACK_TO"); do
        ip="$SUBNET.$i"
        [ "$ip" = "$puerta_ip" ] && continue
        [ "$ip" = "$patio_ip" ] && continue
        puerta_lines="${puerta_lines}    - rtsp://$USER:$PASS@$ip:8554/profile0#transport=tcp\n"
    done

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
    log "Found:$(echo "$camaras" | tr '\n' ' ')"

    local patio_ip=$(find_camera_ip "$camaras" "$PATIO_MAC")
    local puerta_ip=$(find_camera_ip "$camaras" "$PUERTA_MAC")

    if [ -z "$patio_ip" ]; then
        patio_ip="$KNOWN_PATIO"
        log "Patio no detectada por MAC, usando $patio_ip"
    fi
    if [ -z "$puerta_ip" ]; then
        puerta_ip="$KNOWN_PUERTA"
        log "Puerta no detectada por MAC, usando $puerta_ip"
    fi
    log "Patio=$patio_ip Puerta=$puerta_ip"

    local old_md5=""
    [ -f "$CONF" ] && old_md5=$(md5sum "$CONF" 2>/dev/null | awk '{print $1}')

    generate_config "$patio_ip" "$puerta_ip"

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
