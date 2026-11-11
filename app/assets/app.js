// Reproduccion en vivo via HLS (hls.js), con fallback al reproductor de go2rtc
// si el video no avanza (corte de señal, navegador sin soporte, etc).

window.playingSince = {};

document.addEventListener('DOMContentLoaded', function () {
  for (var id in window.CAMERAS) {
    if (Object.prototype.hasOwnProperty.call(window.CAMERAS, id)) {
      iniciar(id, window.CAMERAS[id]);
    }
  }
  configurarDual();
});

function iniciar(id, cam) {
  var video = document.getElementById('v-' + id);
  var off = document.getElementById('off-' + id);
  var dot = document.getElementById('dot-' + id);

  function marcar(ok) {
    if (off) off.style.display = ok ? 'none' : 'block';
    if (dot) dot.classList.toggle('on', !!ok);
    if (ok) window.playingSince[id] = Date.now();
  }

  function enReproduccion() {
    marcar(true);
  }

  var hayHlsJs = window.Hls && Hls.isSupported();
  var hayNativo = video.canPlayType('application/vnd.apple.mpegurl');

  if (hayNativo) {
    // Safari / iOS
    video.src = cam.hls;
    video.addEventListener('playing', enReproduccion);
    video.addEventListener('error', function () { marcar(false); });
    marcar(false);
  } else if (hayHlsJs) {
    var hls = new Hls({
      liveDurationInfinity: true,
      liveSyncDurationCount: 2
    });
    hls.on(Hls.Events.MANIFEST_PARSED, enReproduccion);
    hls.on(Hls.Events.ERROR, function (_e, data) {
      if (!data.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hls.startLoad();
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
      } else {
        marcar(false);
      }
    });
    video.addEventListener('playing', enReproduccion);
    hls.loadSource(cam.hls);
    hls.attachMedia(video);
    marcar(false);
  } else {
    if (off) off.textContent = 'Tu navegador no soporta video';
    marcar(false);
    return;
  }

  // Vigilante: si en ~12s el video no avanzo, pasar al reproductor de go2rtc.
  var ultimo = 0;
  var contador = 0;
  var vigilante = setInterval(function () {
    var actual = video.currentTime || 0;
    var avanzo = actual !== ultimo;
    ultimo = actual;
    contador++;
    if (contador >= 3 && !avanzo) {
      clearInterval(vigilante);
      setTimeout(function () {
        var a2 = video.currentTime || 0;
        if (Math.abs(a2 - actual) < 0.01) {
          fallbackGo2rtc(id, cam);
        }
      }, 4000);
    }
  }, 4000);
}

function fallbackGo2rtc(id, cam) {
  var sec = document.querySelector('.cam[data-cam="' + id + '"]');
  if (!sec || sec.dataset.fallback) return;
  sec.dataset.fallback = '1';

  var video = document.getElementById('v-' + id);
  var off = document.getElementById('off-' + id);
  var dot = document.getElementById('dot-' + id);

  var ifr = document.createElement('iframe');
  ifr.src = cam.stream_html;
  ifr.setAttribute('allow', 'autoplay; fullscreen');
  ifr.allowFullscreen = true;
  ifr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#000;';

  if (off) off.style.display = 'none';
  if (dot) dot.classList.add('on');
  if (video) video.replaceWith(ifr);
}

function toggleFullscreen(btn) {
  var cam = btn.closest('.cam');
  if (!cam) return;

  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else if (cam.requestFullscreen) {
    cam.requestFullscreen();
  } else if (cam.webkitRequestFullscreen) {
    cam.webkitRequestFullscreen();
  }
}

function configurarDual() {
  var btn = document.getElementById('btn-dual');
  var close = document.getElementById('btn-dual-close');
  var grid = document.querySelector('.live-grid');
  if (!btn || !grid) return;
  if (Object.keys(window.CAMERAS || {}).length < 2) {
    btn.style.display = 'none';
    return;
  }
  btn.addEventListener('click', function () {
    entrarDual(grid);
  });
  if (close) {
    close.addEventListener('click', function () {
      salirDual(grid);
    });
  }
}

function entrarDual(grid) {
  document.body.classList.add('dual-fs');
  grid.classList.add('dual-fs');
  try {
    if (grid.requestFullscreen) {
      var p = grid.requestFullscreen();
      if (p && p.catch) p.catch(function () {});
    } else if (grid.webkitRequestFullscreen) {
      grid.webkitRequestFullscreen();
    }
  } catch (e) {}
}

function salirDual(grid) {
  document.body.classList.remove('dual-fs');
  grid.classList.remove('dual-fs');
  var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (fsEl === grid) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function actualizarPantallaCompleta() {
  var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  var grid = document.querySelector('.live-grid');
  if (grid && fsEl !== grid) {
    document.body.classList.remove('dual-fs');
    grid.classList.remove('dual-fs');
  }
  var btns = document.querySelectorAll('.cam-btn');
  btns.forEach(function (btn) {
    var cam = btn.closest('.cam');
    var isFs = fsEl === cam;
    btn.innerHTML = isFs ? '&#x2716;' : '&#x26F6;';
  });
}

document.addEventListener('fullscreenchange', actualizarPantallaCompleta);
document.addEventListener('webkitfullscreenchange', actualizarPantallaCompleta);
