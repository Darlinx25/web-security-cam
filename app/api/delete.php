<?php
require __DIR__ . '/../config.php';
require __DIR__ . '/../db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('ok' => false, 'error' => 'POST required'));
    exit;
}

$token = $_SERVER['HTTP_X_API_TOKEN'] ?? ($_POST['token'] ?? '');
$esperado = getenv('API_TOKEN') ?: '';
if ($esperado !== '' && hash_equals($esperado, $token)) {
    // ok
} elseif ($esperado === '') {
    // no token configured, allow all
} else {
    http_response_code(403);
    echo json_encode(array('ok' => false, 'error' => 'forbidden'));
    exit;
}

$mode = $_POST['mode'] ?? '';

if ($mode === 'single') {
    $file = $_POST['file'] ?? '';
    if (!$file || preg_match('/\.\./', $file)) {
        http_response_code(400);
        echo json_encode(array('ok' => false, 'error' => 'invalid file'));
        exit;
    }
    $full = $CLIP_DIR . '/' . $file;
    $deleted = 0;
    if (is_file($full)) {
        unlink($full);
        $deleted++;
    }
    $thumb = preg_replace('/\.mp4$/', '.jpg', $full);
    if (is_file($thumb)) {
        unlink($thumb);
    }
    $pdo = db();
    if ($pdo !== null) {
        $stmt = $pdo->prepare('DELETE FROM clips WHERE file_path = ?');
        $stmt->execute(array($file));
    }
    echo json_encode(array('ok' => true, 'deleted' => $deleted));
    exit;
}

if ($mode === 'range') {
    $from = $_POST['from'] ?? '';
    $to = $_POST['to'] ?? '';
    $cam = $_POST['camera'] ?? '';

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
        http_response_code(400);
        echo json_encode(array('ok' => false, 'error' => 'invalid dates'));
        exit;
    }

    $from_date = new DateTime($from);
    $to_date = new DateTime($to);
    $to_date->modify('+1 day');
    $deleted = 0;

    $current = clone $from_date;
    while ($current < $to_date) {
        $ymd = $current->format('Y/m/d');
        $dir = $CLIP_DIR . '/' . $ymd;
        if (is_dir($dir)) {
            $pattern = $cam ? "$dir/" . preg_quote($cam, '/') . '_*.mp4' : "$dir/*_*.mp4";
            foreach (glob($pattern) as $mp4) {
                unlink($mp4);
                $deleted++;
                $jpg = preg_replace('/\.mp4$/', '.jpg', $mp4);
                if (is_file($jpg)) unlink($jpg);
            }
        }
        $current->modify('+1 day');
    }

    $pdo = db();
    if ($pdo !== null) {
        $sql = 'DELETE FROM clips WHERE DATE(start_time) >= ? AND DATE(start_time) <= ?';
        $params = array($from, $to);
        if ($cam) {
            $sql .= ' AND camera = ?';
            $params[] = $cam;
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    echo json_encode(array('ok' => true, 'deleted' => $deleted, 'from' => $from, 'to' => $to));
    exit;
}

http_response_code(400);
echo json_encode(array('ok' => false, 'error' => 'invalid mode'));
