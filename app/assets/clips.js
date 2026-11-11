// Navegador de grabaciones con borrado.
document.addEventListener('DOMContentLoaded', function () {
  var fecha = document.getElementById('f-fecha');
  var cam = document.getElementById('f-cam');
  var btnHoy = document.getElementById('btn-hoy');
  var status = document.getElementById('clips-status');
  var lista = document.getElementById('clips-list');
  var paginado = document.getElementById('clips-paginado');
  var API_TOKEN = window.CLIPS_API_TOKEN || '';
  var PER_PAGE = 20;
  var allClips = [];
  var currentPage = 1;

  function cargar() {
    var d = fecha.value;
    var c = cam.value;
    status.textContent = 'Buscando...';
    lista.innerHTML = '';
    paginado.innerHTML = '';

    fetch('api/clips.php?date=' + encodeURIComponent(d) + '&cam=' + encodeURIComponent(c))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) {
          status.textContent = data.error || 'Error al buscar';
          return;
        }
        var camNom = (window.CAMERAS && window.CAMERAS[c]) ? window.CAMERAS[c].name : c;
        if (data.count === 0) {
          status.textContent = 'Sin grabaciones para ' + camNom + ' (' + d + ')';
          return;
        }
        allClips = data.clips;
        currentPage = 1;
        status.textContent = data.count + ' grabaciones de ' + camNom + ' (' + d + ')';
        renderPage();
      })
      .catch(function () {
        status.textContent = 'No se pudo consultar el servidor';
      });
  }

  function renderPage() {
    var total = allClips.length;
    var pages = Math.ceil(total / PER_PAGE);
    if (currentPage > pages) currentPage = pages;
    var start = (currentPage - 1) * PER_PAGE;
    var end = start + PER_PAGE;
    var page = allClips.slice(start, end);

    lista.innerHTML = '';
    var frag = document.createDocumentFragment();
    page.forEach(function (clip) {
      frag.appendChild(tarjeta(clip));
    });
    lista.appendChild(frag);

    paginado.innerHTML = '';
    if (pages <= 1) return;

    var prev = document.createElement('button');
    prev.className = 'btn-page';
    prev.textContent = '\u25C0';
    prev.disabled = currentPage <= 1;
    prev.addEventListener('click', function () { currentPage--; renderPage(); lista.scrollIntoView({ behavior: 'smooth' }); });

    var info = document.createElement('span');
    info.className = 'page-info';
    info.textContent = currentPage + ' / ' + pages;

    var next = document.createElement('button');
    next.className = 'btn-page';
    next.textContent = '\u25B6';
    next.disabled = currentPage >= pages;
    next.addEventListener('click', function () { currentPage++; renderPage(); lista.scrollIntoView({ behavior: 'smooth' }); });

    paginado.appendChild(prev);
    paginado.appendChild(info);
    paginado.appendChild(next);
  }

  function tarjeta(clip) {
    var div = document.createElement('div');
    div.className = 'clip';
    div.setAttribute('data-file', clip.file);

    var row = document.createElement('div');
    row.className = 'clip-row';
    row.addEventListener('click', function () { ver(div, clip); });

    var thumb = document.createElement('img');
    thumb.className = 'clip-thumb';
    thumb.src = clip.thumb;
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.onerror = function () { thumb.style.visibility = 'hidden'; };

    var info = document.createElement('div');
    info.className = 'clip-info';

    var hora = document.createElement('div');
    hora.className = 'clip-hora';
    hora.textContent = clip.start;

    var meta = document.createElement('div');
    meta.className = 'clip-meta';
    meta.textContent = duracion(clip.duration) + ' · ' + tamanio(clip.size);

    info.appendChild(hora);
    info.appendChild(meta);

    var acc = document.createElement('div');
    acc.className = 'clip-actions';

    var bVer = document.createElement('button');
    bVer.className = 'btn-small btn-play';
    bVer.textContent = 'Ver';
    bVer.addEventListener('click', function (e) { e.stopPropagation(); ver(div, clip); });

    var bDl = document.createElement('a');
    bDl.className = 'btn-small btn-dl';
    bDl.textContent = 'Descargar';
    bDl.href = clip.url;
    bDl.setAttribute('download', '');
    bDl.addEventListener('click', function (e) { e.stopPropagation(); });

    var bDel = document.createElement('button');
    bDel.className = 'btn-small btn-del';
    bDel.textContent = '\uD83D\uDDD1';
    bDel.title = 'Borrar clip';
    bDel.addEventListener('click', function (e) {
      e.stopPropagation();
      borrarClip(div, clip);
    });

    acc.appendChild(bVer);
    acc.appendChild(bDl);
    acc.appendChild(bDel);

    row.appendChild(thumb);
    row.appendChild(info);
    row.appendChild(acc);

    var videoBox = document.createElement('div');
    videoBox.className = 'clip-video';
    var video = document.createElement('video');
    video.controls = true;
    video.preload = 'none';
    video.style.width = '100%';
    videoBox.appendChild(video);

    div.appendChild(row);
    div.appendChild(videoBox);
    return div;
  }

  function ver(div, clip) {
    var box = div.querySelector('.clip-video');
    var video = box.querySelector('video');
    var abierto = box.style.display === 'block';
    if (abierto) {
      video.pause();
      box.style.display = 'none';
      return;
    }
    document.querySelectorAll('.clip-video').forEach(function (o) {
      o.style.display = 'none';
      var v = o.querySelector('video');
      if (v) v.pause();
    });
    video.src = clip.url;
    box.style.display = 'block';
    video.play().catch(function () {});
    video.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function borrarClip(div, clip) {
    if (!confirm('Borrar este clip?')) return;
    var fd = new FormData();
    fd.append('mode', 'single');
    fd.append('file', clip.file);
    fetch('api/delete.php', {
      method: 'POST',
      headers: { 'X-API-Token': API_TOKEN },
      body: fd
    })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.ok) {
        allClips = allClips.filter(function (c) { return c.file !== clip.file; });
        renderPage();
        var total = allClips.length;
        status.textContent = total + ' grabaciones restantes';
      } else {
        alert('Error: ' + (d.error || 'desconocido'));
      }
    })
    .catch(function () { alert('Error de conexion'); });
  }

  // Borrado masivo por rango
  var bulkFrom = document.getElementById('bulk-from');
  var bulkTo = document.getElementById('bulk-to');
  var bulkCam = document.getElementById('bulk-cam');
  var btnBulkDel = document.getElementById('btn-bulk-delete');
  var btnBulkAll = document.getElementById('btn-bulk-all');

  if (btnBulkDel) {
    btnBulkDel.addEventListener('click', function () {
      var from = bulkFrom.value;
      var to = bulkTo.value;
      if (!from || !to) { alert('Selecciona desde y hasta'); return; }
      if (!confirm('Borrar clips del ' + from + ' al ' + to + '?')) return;
      var fd = new FormData();
      fd.append('mode', 'range');
      fd.append('from', from);
      fd.append('to', to);
      if (bulkCam.value) fd.append('camera', bulkCam.value);
      btnBulkDel.disabled = true;
      btnBulkDel.textContent = 'Borrando...';
      fetch('api/delete.php', {
        method: 'POST',
        headers: { 'X-API-Token': API_TOKEN },
        body: fd
      })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        btnBulkDel.disabled = false;
        btnBulkDel.textContent = 'Borrar rango';
        if (d.ok) {
          alert('Borrados: ' + d.deleted + ' clips');
          cargar();
        } else {
          alert('Error: ' + (d.error || 'desconocido'));
        }
      })
      .catch(function () {
        btnBulkDel.disabled = false;
        btnBulkDel.textContent = 'Borrar rango';
        alert('Error de conexion');
      });
    });
  }

  if (btnBulkAll) {
    btnBulkAll.addEventListener('click', function () {
      if (!confirm('Borrar TODAS las grabaciones del dia ' + fecha.value + '?')) return;
      var fd = new FormData();
      fd.append('mode', 'range');
      fd.append('from', fecha.value);
      fd.append('to', fecha.value);
      if (bulkCam.value) fd.append('camera', bulkCam.value);
      btnBulkAll.disabled = true;
      btnBulkAll.textContent = 'Borrando...';
      fetch('api/delete.php', {
        method: 'POST',
        headers: { 'X-API-Token': API_TOKEN },
        body: fd
      })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        btnBulkAll.disabled = false;
        btnBulkAll.textContent = 'Borrar dia';
        if (d.ok) {
          alert('Borrados: ' + d.deleted + ' clips');
          cargar();
        } else {
          alert('Error: ' + (d.error || 'desconocido'));
        }
      })
      .catch(function () {
        btnBulkAll.disabled = false;
        btnBulkAll.textContent = 'Borrar dia';
        alert('Error de conexion');
      });
    });
  }

  function duracion(seg) {
    if (!seg || seg <= 0) return '';
    var m = Math.floor(seg / 60);
    var s = Math.round(seg % 60);
    return m > 0 ? m + ' min ' + s + ' s' : s + ' s';
  }

  function tamanio(bytes) {
    if (!bytes) return '';
    var kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(0) + ' KB';
    return (kb / 1024).toFixed(1) + ' MB';
  }

  fecha.addEventListener('change', cargar);
  cam.addEventListener('change', cargar);
  btnHoy.addEventListener('click', function () {
    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0');
    var yyyy = hoy.getFullYear();
    fecha.value = yyyy + '-' + mm + '-' + dd;
    cargar();
  });

  cargar();
});
