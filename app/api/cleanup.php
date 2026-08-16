<?php
// POST: el grabador limpia archivos viejos del filesystem y luego llama aca
// para borrar de la base los clips cuyo archivo ya no existe.
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

$pdo = db();
if ($pdo === null) {
    echo json_encode(array('ok' => true, 'borrados' => 0, 'db' => false));
    exit;
}

// Reconciliar: borrar filas cuyo archivo no existe en disco
$filas = $pdo->query('SELECT id, file_path FROM clips')->fetchAll();
$borrados = 0;
$stmt = $pdo->prepare('DELETE FROM clips WHERE id = ?');
foreach ($filas as $f) {
    if (!is_file($CLIP_DIR . '/' . $f['file_path'])) {
        $stmt->execute(array((int)$f['id']));
        $borrados++;
    }
}

// Y como seguridad extra, borrar filas con mas de RETENTION_DAYS dias
$dias = (int)(getenv('RETENTION_DAYS') ?: 5);
$stmt2 = $pdo->prepare('DELETE FROM clips WHERE start_time < DATE_SUB(NOW(), INTERVAL ? DAY)');
$stmt2->execute(array($dias));
$borrados += $stmt2->rowCount();

echo json_encode(array('ok' => true, 'borrados' => $borrados));
