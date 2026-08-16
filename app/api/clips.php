<?php
// GET: lista de clips.
// Parametros: date=YYYY-MM-DD, cam=patio
// Fuente principal: base de datos. Si no hay base, escanea el filesystem.
require __DIR__ . '/../config.php';
require __DIR__ . '/../db.php';

header('Content-Type: application/json');

$fecha = $_GET['date'] ?? date('Y-m-d');
$cam = $_GET['cam'] ?? 'patio';

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'fecha invalida'));
    exit;
}

// ruta del dia: YYYY/MM/DD
list($y, $m, $d) = explode('-', $fecha);
$relDir = "$y/$m/$d";

$pdo = db();
$clips = array();
$source = 'fs';

if ($pdo !== null) {
    $stmt = $pdo->prepare(
        'SELECT id, camera, file_path, size_bytes, duration,
                DATE_FORMAT(start_time, "%Y-%m-%d %H:%i:%s") AS start
         FROM clips
         WHERE camera = ? AND DATE(start_time) = ?
         ORDER BY start_time DESC'
    );
    $stmt->execute(array($cam, $fecha));
    $rows = $stmt->fetchAll();
    if (!empty($rows)) {
        $source = 'db';
        foreach ($rows as $r) {
            $clips[] = array(
                'id' => (int)$r['id'],
                'camera' => $r['camera'],
                'file' => $r['file_path'],
                'url' => '/clips/' . $r['file_path'],
                'thumb' => '/clips/' . preg_replace('/\.mp4$/', '.jpg', $r['file_path']),
                'size' => (int)$r['size_bytes'],
                'duration' => (float)$r['duration'],
                'start' => $r['start'],
            );
        }
    }
}

// Si la base no tenia datos (o no existe), leer del filesystem
if ($source === 'fs') {
    $dir = $CLIP_DIR . '/' . $relDir;
    $patron = "$dir/" . preg_quote($cam, '/') . '_*.mp4';
    foreach (glob($patron) ?: array() as $archivo) {
        $base = basename($archivo);
        $ruta = "$relDir/$base";
        $fechaHora = array();
        // patio_20260816_113000.mp4
        if (preg_match('/_(\d{8})_(\d{6})\.mp4$/', $base, $fechaHora)) {
            $inicio = date('Y-m-d H:i:s', strtotime($fechaHora[1] . ' ' . $fechaHora[2]));
        } else {
            $inicio = date('Y-m-d H:i:s', filemtime($archivo));
        }
        $clips[] = array(
            'id' => 0,
            'camera' => $cam,
            'file' => $ruta,
            'url' => '/clips/' . $ruta,
            'thumb' => '/clips/' . preg_replace('/\.mp4$/', '.jpg', $ruta),
            'size' => (int)filesize($archivo),
            'duration' => 0,
            'start' => $inicio,
        );
    }
    usort($clips, function ($a, $b) {
        return strcmp($b['start'], $a['start']);
    });
}

echo json_encode(array(
    'ok' => true,
    'date' => $fecha,
    'camera' => $cam,
    'source' => $source,
    'count' => count($clips),
    'clips' => $clips,
));
