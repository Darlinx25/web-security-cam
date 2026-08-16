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
        <video id="v-<?= htmlspecialchars($id) ?>" autoplay muted playsinline controls></video>
        <div class="off" id="off-<?= htmlspecialchars($id) ?>">Sin se&ntilde;al...</div>
      </div>
    </section>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
</main>
<script src="assets/hls.min.js"></script>
<script>
  window.CAMERAS = <?= json_encode($activas, JSON_PRETTY_PRINT) ?>;
</script>
<script src="assets/app.js"></script>
</body>
</html>
