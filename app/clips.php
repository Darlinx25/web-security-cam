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
        <option value="">Todas</option>
        <?php foreach (camerayActivas() as $id => $cam): ?>
        <option value="<?= htmlspecialchars($id) ?>"><?= htmlspecialchars($cam['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
    <button class="btn" id="btn-hoy">Hoy</button>
  </div>

  <div id="clips-status" class="status"></div>
  <div id="clips-list" class="clips-list"></div>
  <div id="clips-paginado" class="clips-paginado"></div>

  <div class="bulk-delete">
    <h3>Borrar grabaciones</h3>
    <div class="bulk-row">
      <label>Desde <input type="date" id="bulk-from" max="<?= htmlspecialchars($hoy) ?>"></label>
      <label>Hasta <input type="date" id="bulk-to" max="<?= htmlspecialchars($hoy) ?>"></label>
      <label>C&aacute;mara
        <select id="bulk-cam">
          <option value="">Todas</option>
          <?php foreach (camerayActivas() as $id => $cam): ?>
          <option value="<?= htmlspecialchars($id) ?>"><?= htmlspecialchars($cam['name']) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
      <button class="btn btn-danger" id="btn-bulk-delete">Borrar rango</button>
      <button class="btn btn-danger" id="btn-bulk-all">Borrar dia</button>
    </div>
  </div>
</main>
<script>
  window.CAMERAS = <?= json_encode(camerayActivas(), JSON_PRETTY_PRINT) ?>;
  window.CLIPS_API_TOKEN = <?= json_encode(getenv('API_TOKEN') ?: '') ?>;
</script>
<script src="assets/clips.js"></script>
</body>
</html>
