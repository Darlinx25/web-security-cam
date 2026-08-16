<?php
// Uso: $ACTIVE = 'live'|'clips'; require __DIR__ . '/_header.php';
if (!isset($ACTIVE)) {
    $ACTIVE = 'live';
}
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Camaras</title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header class="topbar">
  <div class="brand">Camaras</div>
  <nav class="nav">
    <a href="index.php" class="<?= $ACTIVE === 'live' ? 'active' : '' ?>">EN VIVO</a>
    <a href="clips.php" class="<?= $ACTIVE === 'clips' ? 'active' : '' ?>">GRABACIONES</a>
  </nav>
</header>
