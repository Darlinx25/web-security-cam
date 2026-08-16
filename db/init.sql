-- Esquema inicial de la base de clips (se ejecuta solo la primera vez).
CREATE TABLE IF NOT EXISTS clips (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  camera VARCHAR(32) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  duration DOUBLE NOT NULL DEFAULT 0,
  start_time DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cam_fecha (camera, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
