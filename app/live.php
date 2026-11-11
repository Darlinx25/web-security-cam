<?php
$ACTIVE = 'live';
require __DIR__ . '/config.php';
require __DIR__ . '/_header.php';
$activas = camerayActivas();
?>
<main class="live-wrap">
  <?php if (empty($activas)): ?>
    <div class="vacio">No hay camaras configuradas.</div>
  <?php else: ?>
  <div class="live-grid">
    <?php foreach ($activas as $id => $cam): ?>
    <section class="cam" data-cam="<?= htmlspecialchars($id) ?>">
      <div class="cam-head">
        <span class="dot" id="dot-<?= htmlspecialchars($id) ?>"></span>
        <span class="cam-name"><?= htmlspecialchars($cam['name']) ?></span>
      </div>
      <div class="cam-body">
        <video id="v-<?= htmlspecialchars($id) ?>" autoplay muted playsinline controls
          onclick="if(this.webkitEnterFullscreen)this.webkitEnterFullscreen();else if(this.requestFullscreen)this.requestFullscreen();"></video>
        <div class="off" id="off-<?= htmlspecialchars($id) ?>">Sin se&ntilde;al...</div>
      </div>
    </section>
    <?php endforeach; ?>
    <button type="button" id="btn-dual-close" class="dual-close" aria-label="Salir de pantalla completa">&#x2715;</button>
  </div>
  <?php if (count($activas) >= 2): ?>
  <button type="button" id="btn-dual" class="dual-fab" title="Ver las dos camaras a la vez">
    <span class="dual-fab-icon">&#x26F6;</span> 2 CAM
  </button>
  <?php endif; ?>
  <?php endif; ?>
</main>
<script src="assets/hls.min.js"></script>
<script>
  window.CAMERAS = <?= json_encode($activas, JSON_PRETTY_PRINT) ?>;
</script>
<script src="assets/app.js"></script>
</body>
</html>
