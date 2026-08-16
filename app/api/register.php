<?php
// POST: el grabador registra un clip terminado.
// Campos: camera, file, size, duration, start_ts
// Auth: cabecera X-API-Token (o POST 'token')
require __DIR__ . '/../config.php';
require __DIR__ . '/../db.php';

header('Content-Type: application/json');

$token = $_SERVER['HTTP_X_API_TOKEN'] ?? ($_POST['token'] ?? '');
$esperado = getenv('API_TOKEN') ?: '';
if ($esperado === '' || !hash_equals($esperado, $token)) {
    http_response_code(401);
    echo json_encode(array('ok' => false, 'error' => 'token invalido'));
    exit;
}

$cam = $_POST['camera'] ?? '';
$file = $_POST['file'] ?? '';
$size = (int)($_POST['size'] ?? 0);
$dur = (float)($_POST['duration'] ?? 0);
$startTs = (int)($_POST['start_ts'] ?? 0);

if ($cam === '' || $file === '' || $startTs <= 0) {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'faltan datos'));
    exit;
}

$pdo = db();
if ($pdo === null) {
    // La base no esta; el clip queda en disco igualmente.
    echo json_encode(array('ok' => true, 'registrado' => false));
    exit;
}

$stmt = $pdo->prepare(
    'INSERT INTO clips (camera, file_path, size_bytes, duration, start_time)
     VALUES (?, ?, ?, ?, FROM_UNIXTIME(?))'
);
$stmt->execute(array($cam, $file, $size, $dur, $startTs));

echo json_encode(array('ok' => true, 'registrado' => true, 'id' => (int)$pdo->lastInsertId()));
