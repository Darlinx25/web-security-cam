<?php
date_default_timezone_set(getenv('TZ') ?: 'America/Argentina/Buenos_Aires');

// Host donde corre go2rtc (visto por el NAVEGADOR del cliente).
// Si GO2RTC_HOST esta vacio, usa la misma maquina que sirvio la pagina
// (la laptop con go2rtc en docker), asi no hay que conocer la IP.
$GO2RTC_HOST = getenv('GO2RTC_HOST') ?: (preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? 'localhost') ?: 'localhost');
$GO2RTC_HLS_PORT = getenv('GO2RTC_HLS_PORT') ?: '1984';

// Directorio de clips (montado dentro del contenedor web)
$CLIP_DIR = getenv('CLIP_DIR') ?: '/var/www/html/clips';

// Camaras. 'hls' es la fuente que usa el navegador. 'enabled' controla visibilidad.
$CAMERAS = array(
    'patio' => array(
        'name'    => 'Patio',
        'hls'     => 'http://' . $GO2RTC_HOST . ':' . $GO2RTC_HLS_PORT . '/api/stream.m3u8?src=patio',
        'stream_html' => 'http://' . $GO2RTC_HOST . ':' . $GO2RTC_HLS_PORT . '/stream.html?src=patio',
        'enabled' => getenv('CAMERA_ENABLED_PATIO') !== '0',
    ),
    'puerta' => array(
        'name'    => 'Puerta',
        'hls'     => 'http://' . $GO2RTC_HOST . ':' . $GO2RTC_HLS_PORT . '/api/stream.m3u8?src=puerta',
        'stream_html' => 'http://' . $GO2RTC_HOST . ':' . $GO2RTC_HLS_PORT . '/stream.html?src=puerta',
        'enabled' => getenv('CAMERA_ENABLED_PUERTA') !== '0',
    ),
);

function camerayActivas()
{
    global $CAMERAS;
    return array_filter($CAMERAS, function ($c) {
        return $c['enabled'];
    });
}
