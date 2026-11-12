<?php
// Uso: $ACTIVE = 'live'|'clips'; require __DIR__ . '/_header.php';
if (!isset($ACTIVE)) {
    $ACTIVE = 'live';
}
// URL del panel de estado (Homepage). Si PANEL_URL esta vacio, apunta a la
// misma maquina que sirvio la pagina, en el puerto 3000.
$PANEL_URL = getenv('PANEL_URL') ?: 'http://' . (preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? 'localhost') ?: 'localhost') . ':3000';
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
    <a href="<?= htmlspecialchars($PANEL_URL) ?>" class="panel-link"
       target="_blank" rel="noopener" title="Panel de estado del servidor"
       aria-label="Abrir el panel de estado del servidor">
      <span class="panel-icon">&#9638;</span><span class="panel-label">PANEL</span>
    </a>
  </nav>
</header>
