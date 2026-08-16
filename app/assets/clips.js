// Navegador de grabaciones.
document.addEventListener('DOMContentLoaded', function () {
  var fecha = document.getElementById('f-fecha');
  var cam = document.getElementById('f-cam');
  var btnHoy = document.getElementById('btn-hoy');
  var status = document.getElementById('clips-status');
  var lista = document.getElementById('clips-list');

  function cargar() {
    var d = fecha.value;
    var c = cam.value;
    status.textContent = 'Buscando...';
    lista.innerHTML = '';

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
        status.textContent = data.count + ' grabaciones de ' + camNom + ' (' + d + ')';
        pintar(data.clips);
      })
      .catch(function () {
        status.textContent = 'No se pudo consultar el servidor';
      });
  }

  function pintar(clips) {
    var frag = document.createDocumentFragment();
    clips.forEach(function (clip) {
      frag.appendChild(tarjeta(clip));
    });
    lista.appendChild(frag);
  }

  function tarjeta(clip) {
    var div = document.createElement('div');
    div.className = 'clip';

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

    acc.appendChild(bVer);
    acc.appendChild(bDl);

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
    // cerrar otros
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
