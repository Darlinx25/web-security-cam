<?php
// Conexion PDO a MariaDB. Devuelve null si la base no esta disponible.
function db()
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: 'db';
    $name = getenv('DB_NAME') ?: 'clips';
    $user = getenv('DB_USER') ?: 'clipapp';
    $pass = getenv('DB_PASSWORD') ?: 'clipapp';

    try {
        $pdo = new PDO(
            "mysql:host=$host;dbname=$name;charset=utf8mb4",
            $user,
            $pass,
            array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 3,
            )
        );
    } catch (PDOException $e) {
        return null;
    }
    return $pdo;
}
