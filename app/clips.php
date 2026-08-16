<?php
$ACTIVE = 'clips';
require __DIR__ . '/config.php';
require __DIR__ . '/_header.php';
$hoy = date('Y-m-d');
?>
<main class="clips-wrap">
  <div class="controls">
    <label class="ctl">D&iacute;a
      <input type="date" id="f-fecha" value="<?= htmlspecialchars($hoy) ?>" max="<?= htmlspecialchars($hoy) ?>">
    </label>
    <label class="ctl">C&aacute;mara
      <select id="f-cam">
        <?php foreach (camerayActivas() as $id => $cam): ?>
        <option value="<?= htmlspecialchars($id) ?>"><?= htmlspecialchars($cam['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
    <button class="btn" id="btn-hoy">Hoy</button>
  </div>

  <div id="clips-status" class="status"></div>
  <div id="clips-list" class="clips-list"></div>
</main>
<script>
  window.CAMERAS = <?= json_encode(camerayActivas(), JSON_PRETTY_PRINT) ?>;
</script>
<script src="assets/clips.js"></script>
</body>
</html>
