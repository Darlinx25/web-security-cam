<?php
// Uso: $ACTIVE = 'live'|'clips'; require __DIR__ . '/_header.php';
if (!isset($ACTIVE)) {
    $ACTIVE = 'live';
}
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0b0d10">
<meta name="mobile-web-app-capable" content="yes">
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
